<template>
    <div class="v-select" :class="classes" tabindex="-1" 
        @focusin="$refs.inp.focus()" 
        @focusout="attemptClose()"
        @keydown.down.prevent="next()"
        @keydown.up.prevent="next(true)"
        @keydown.home.prevent="mark(false)"
        @keydown.end.prevent="mark(true)"
        @keydown.esc="mark().close()"
        @keydown.delete="onDelKey()"
        @keydown.enter="onKeyDownEnter"
        @mousedown.left="open()">

        <div class="v-select-bar">
            
            <!-- SELECTED -->
            <v-select-selected v-for="(option,i) in value_" :key="option.index" :option="option" :index="i" @deselect="deselect(i)">
                <slot name="selected" :option="option" :index="i" />
            </v-select-selected>

            <!-- SEARCH INPUT -->
            <input ref="inp" v-model.trim="q" v-bind="$attrs" class="v-select-inp"
                @focus="open().search()" @keydown="onKeyDown" @input="open()" :placeholder="placeholder" />

            <!-- ACTION BUTTONS -->
            <!-- <button @click="clear()" type="button" class="v-select-btn-close" tabindex="-1"></button> -->
            <button @click="open()" type="button" class="v-select-btn-dd" tabindex="-1"></button>
            
        </div>

        <!-- DROPDOWN -->
        <!-- <ul class="v-select-list">
            <li v-if="busy"><v-select-loader :phrase="queue.q"><slot name="loader" :phrase="queue.q" /></v-select-loader></li>
            <li v-for="(option, i) in filteredOptions" :key="option.index"  :ref="'option' + i">
                <v-select-option @select="select(option)" :option="option" :index="i" :state="state">
                    <slot name="option" :option="option" :index="i" :state="state"/>
                </v-select-option>
            </li>
        </ul> -->
        <div class="v-select-list">
            <v-select-loader v-if="busy" :phrase="queue.q"><slot name="loader" :phrase="queue.q" /></v-select-loader>
            <v-select-option v-for="(option, i) in filteredOptions" :key="option.index"  :ref="'option' + i" @select="select(option)" :option="option" :index="i" :state="state">
                <slot name="option" :option="option" :index="i" :state="state"/>
            </v-select-option>
        </div>

    </div>
</template>

<script>
/**
 * TODO:
 * + highlight instead of filtering out selected options
 *   and deselect them on select attempt
 * 
 * - maybe add chevron to the right
 * 
 * - on open scroll to marked 
 * 
 * + if no async -> load options on created()
 * 
 * - find a way to add click events on sloted elements
 * 
 * + fix :hover, .marked, .selected options styles
 * 
 * - pagination
 * 
 * + emit event for new options creation when tagging
 * 
 * - mark the first result when searching
 * 
 * - find a way to recognize new options*
 * 
 * - prevent form submission when tagging / selecting
 * 
 * - use customisable components as default slots content
 * 
 * - loading design ?
 * 
 * - when hold down backspace/delete delete only q & 
 *   wait for another press to clear tags/value
 * 
 * - markMatch is not working fine with async options
 */
// eslint-disable-next-line
import { mid, fetchAdapter, Deferred as dfd, model, isset, isPrimitive, debounce, me, error } from '../utils'

import vSelectOption from './option';
import vSelectSelected from './selected'
import vSelectLoader from './loader'

export default {
    name: 'Select',

    components: { vSelectOption, vSelectSelected, vSelectLoader },

    props: {

        /**
         * Make use of v-model
         */
        value: { },

        /**
         * Options for the dropdown. Sould be one of:
         * 
         * Array:     Array of select options
         * Funcgtion: Function that returns an array of options or promise that resolves to an array of options
         * String:    Url that will be passed to the fetch function
         * Object:    Config object to be passed to the fetch function.
         */
        options: {
            type: [ Array, Function, String, Object ], 
            default(){ return []} 
        },

        /**
         * Option descriptor in the format 'label:value:index'
         * 
         * label: Path to option property that will be the label. It is used for filtering as well.
         *        If options are objects this field is required.
         * 
         * value: Path to option proprty that will be used as value of the option.
         *        If ommited the whole option is used.
         * 
         * index: Path to unique property of the option used for comparison.
         *        If ommited falls back to value.
         */
        as: [String],

        /**
         * Parses the response from the server.
         * Should return the array of options.
         */
        parse: {
            type: [Function, String],
            default: me
        },

        fetch: {
            type: Function,
            default: async function(options, q){

                let url = options.url || options;

                // await new Promise( rs => setTimeout(rs, 3000) ) // fake slow network
                
                return await fetchAdapter(url.replace('%s', q))
            },
        },

        filter: {
            type: Function,
            default( {label}, q ){
                return ~(label + '').toLowerCase().indexOf(q.toLowerCase())
            },
        },

        /**
         * Debounce in ms for the search function 
         */
        debounce: { type: Number, default: 250 },

        tagging: [Boolean, String],

        tagKeys: {type: Array, default: () => [] },
    },

    inheritAttrs: false,

    data(){
        return {
            q: '',
            opened: false,
            marked: -1,
            queue: null,
            busy: false,
            value_: [],
            options_: [],
            AS: {
                rx: /\s*[,:]\s*/,
                order: 'label:value:index'.split(':')
            }
        }
    },

    computed: {
        is_multiple(){ 
            return typeof this.multiple == 'undefined' ? Array.isArray(this.value) : !!this.multiple
        },
        is_dynamic(){ 
            let { options } = this;

            return !Array.isArray(options) && (typeof this.options != 'string' || ~this.options.indexOf('%s'))
        },
        is_primitive(){ 
            return !this.as_ || !Object.values(this.as_).some(Boolean)
        },
        is_tagging(){ 
            return isset(this.tagging) ? this.tagging : 'tagging' in this.$attrs
        },
        is_async(){ 
            return !Array.isArray(this.options) 
        },
        
        /**
         * getters & setters for the label, value and index
         */
        as_(){

            let as = this.as && this.as.split(this.AS.rx);

            if(!as) return;
            
            as = this.AS.order
                .map( (e, i) => as[i] && model(as[i]) )
                .reduce( (m, e, i) => ({ ...m,  [this.AS.order[i]]: e }), {})

            as.index = as.index || as.value || error('`index` field is required when working with non primitive options');

            return as;
        },
        
        filteredOptions(){

            let { q } = this;
            
            return this.is_dynamic || !q.length 
                ? this.options_ 
                : this.options_.filter( option => {
                    return this.filter(option, q)
                })
        },

        state(){
            return {
                opened: this.opened,
                busy: this.busy,
                multiple: this.is_multiple,
                searching: !!this.q,
                empty: !this.value_.length,
                marked: this.filteredOptions[this.marked],
                selected: this.value_
            }
        },
        classes(){
            let { state } = this;
            return {
                '--opened': state.opened, 
                '--busy': state.busy, 
                '--multiple': state.multiple,
                '--searching': state.searching,
                '--empty': state.empty
            }
        },
        debouncedSearch(){
            return debounce(this.debounce, this.search)
        },
        parse_(){

            return typeof this.parse == 'string' ? model(this.parse) : this.parse
        },
        placeholder(){
            return this.value_.length && !this.is_multiple ? '' : this.$attrs.placeholder || 'Search..'
        }
    },

    watch: {
        value: {
            immediate: true,
            handler(){
                this.q = '';
                this.syncValue();
                if(!this.is_multiple && isset(this.value)) this.blur();
            }
        },

        options(){
            this.queue = null;
        },

        options_(val, old){
            this.syncValue();
        },

        filteredOptions(){
            
            this.markMatch()
        },

        q: 'debouncedSearch',

        queue(promise){
            
            this.busy = promise && !!promise.finally( () => this.busy = promise != this.queue )
        }
    },

    methods: {
        async search(){

            let { options, q } = this, queue, old = this.queue;
            
            // do not proceed if the result is cached 
            if(this.queue && (!this.is_dynamic || ( this.queue.q == q) ) ) return;

            queue = this.queue = new Promise( rs => {
                
                    if( Array.isArray(options) ) return rs(options)

                    if( typeof options == 'function' ) return rs(options(q))
                    
                    rs(this.fetch(options, q))

                })
                .then( res => this.parse_(res) )
                .then( res => res.map( option => this.ofRaw(option) ) )

            queue.q = q; // remeber what `q` was this request associated with

            let options_ = await queue;

            if(queue != this.queue) return;
            
            if(options_ == this.options_) return;
            
            this.options_ = options_;
        },

        async refresh(){
            this.queue = null;
            return this.search();
        },

        ofRaw(raw){

            let as = this.as_;

            let option = this.AS.order.reduce((m, e) => ({
                ...m,
                [e]: as && as[e] ? as[e](raw) : raw
            }), { raw });

            /** 
             * The option may still not have a label if the provided 
             * value is a primitive & the label is therefore unknown.
             * In such case the value will be used as label until 
             * the real label is found from the options list.
             */
            isset( option.label ) || ( option.label = option.value )

            isset( option.index ) || ( option.index = option.label )

            return option;
        },

        ofValue(value){

            if(this.is_primitive) return this.ofRaw(value);

            let raw = value, as = this.as_;

            as && as.value && as.value(raw = {}, value);
            
            let option = this.ofRaw(raw);
            
            return option;
        },

        ofPhrase(q){

            if(this.is_primitive) return this.ofRaw(q);

            let raw = {}, as = this.as_;

            as.value && as.value(raw, q)
            
            as.label && as.label(raw, q)

            return this.ofRaw(raw);
        },

        select(option, fresh = false ){

            let index = this.value_.findIndex( e => this.equals(e, option) );

            // selecting already selected options will deselect them in multiple mode
            if( ~index ) 
                return this.is_multiple ? this.deselect(index) : this.blur()

            option = option.value
            
            if( fresh ){
                this.$emit('create', option)

                if( !this.is_tagging ) return;
            }

            if(this.is_multiple) 
                option = this.value.concat(option)
            
            this.$emit('input',  option )

            this.is_multiple || this.blur()
        },

        deselect(index){

            if(!this.is_multiple) return this.clear();

            let value = [...this.value];

            value.splice(index,1);

            this.$emit('input', value)
        },

        clear(){

            this.$emit('input', this.is_multiple ? [] : undefined)
        },

        exists(option){

            return this.value_.some( e => this.equals(e, option))
        },

        syncValue(){
            
            if(!isset(this.value)) return this.value_ = [];

            let options = this.options_.concat(this.value_);
            
            return this.value_ = [].concat(this.value).map( val => this.ofValue(val) )
                .map( val => options.find( option => this.equals(val, option) ) || val );
        },

        mark(i){
            // use false/true to mark first/last option
            if(!arguments.length) i = -1
            else if( i === false ) i = 0; 
            else if ( i === true ) i = Infinity;

            // assure `i` is a valid index
            i = this.marked = mid(-1, i, this.filteredOptions.length - 1);

            if(~i){
                let li = this.$refs['option' + i];
                li && li[0] && (li[0].$el || li[0]).scrollIntoView({behavior: 'smooth'})
            }
            
            return this;
        },
        
        markMatch(){

            let q = this.q.toLowerCase(),
                options = this.filteredOptions,
                match = options.findIndex( e=> e.label.toLowerCase() == q );
            
            if(~match) return this.mark(match);

            return this//.mark()
        },

        next(prev = false){
            if(!this.opened) return this.open()
            this.mark(this.marked + (-1)**prev)
        },

        equals(a,b){

            if(a.index === b.index) return true;
            
            try {
                return JSON.stringify(a.index) === JSON.stringify(b.index)
            } catch(ex){
                return false
            }
        },

        open(){ 
            if(this.opened) return this;
            this.opened = true; 
            return this.markMatch(); 
        },

        close(){ 
            this.opened = false; 
            if(!this.is_multiple) this.q = '';
            return this; 
        },

        blur(){
            return this.$refs.inp && this.$refs.inp.blur(), this;
        },
        
        attemptClose(){
            
            return this.$el.matches(':focus') 
                || this.$el.querySelector(':focus') 
                || this.close(), this
        },

        onDelKey(){

            if(this.q) return;

            let len = this.value_.length,
                tag = this.value_[len-1]

            len ? this.deselect(len - 1) : this.clear();
        },

        onKeyDownEnter(ev){

            if(!this.q && !~this.marked) return;
            
            ev.preventDefault();

            let option = this.filteredOptions[this.marked];
            console.log(option || this.ofPhrase(this.q));
            
            this.select(option || this.ofPhrase(this.q), !option);
        },
        
        onKeyDown(ev){
            
            if(
                   !this.is_tagging 
                || !this.q 
                || !this.tagKeys.includes(ev.which)
                || (~this.marked && this.filteredOptions[this.marked].label === this.q)
            ) return;
            
            ev.preventDefault(), ev.stopPropagation();

            this.select(this.ofPhrase(this.q));
        }
    },
    
    created(){

        if( !this.is_async || (this.value_.length && this.value_[0].label == this.value_[0].value ))
            this.search();
    }
}

</script>
<style lang="stylus">
    // TODO: add css variables for theming
    $radius = $padding = 3px
    .v-select
        --c-base: #fff
        --c-theme: #f0f0f0
        --c-border: #ccc
        &, *, :before, :after
            box-sizing border-box
            margin 0
        position relative
        outline none
        height 2em
        padding: $padding
        border 1px solid var(--c-border)
        border-radius: $radius
        background var(--c-base)
        .v-select-selected
            &:first-of-type
                border-radius: $radius 0 0 $radius
            &:nth-of-type(n+2)
                margin-left: $padding
        .v-select-bar
            position relative
            height 100%
            display flex
            align-items stretch
            white-space nowrap
        &.--opened
            box-shadow 0 3px 3px rgba(0,0,0,0.16), 0 3px 3px rgba(0,0,0,0.23)
        &:not(.--opened) .v-select-list
            visibility hidden
        .v-select-inp
            flex 1
            min-width 10em
            border none
            background none
            padding 0 .5em
            outline none
            position relative
            z-index 1
            &[readonly]
                cursor default
        [class*="v-select-btn"]
            padding 0 0.5em
            height 100%
            background transparent
            border 1px solid transparent
            cursor pointer
        
        .v-select-btn-close:before
            content '\00D7'
        .v-select-btn-dd
            font-size 0.6em
            &:before
                content: ''
                display: inline-block;
                border: solid transparent;
                border-top-color: #000;
                border-width: .7em .4em 0;
                opacity: .8;
        &.--empty .v-select-btn-close
            display none
        &.--opened .v-select-btn-dd 
            display none

        .v-select-list
            list-style none
            z-index 4
            position absolute
            min-width 100%
            top 100%
            left -1px
            right -1px
            padding 0
            margin-top -1px
            max-height 200px
            overflow hidden
            overflow-y auto
            border inherit
            padding inherit
            background inherit
            border-top-color transparent
            padding-top 0
            font-size 12px
            box-shadow inherit
        ::-webkit-scrollbar
            width 5px
            background rgba(0,0,0,.1)
        ::-moz-scrollbar
            width 5px
        ::-webkit-scrollbar-thumb
            background: rgba(0,0,0,.2)
        ::-moz-scrollbar-thumb
            background: rgba(0,0,0,.2)
        :not(:hover)::-webkit-scrollbar, :not(:hover)::-webkit-scrollbar-thumb
            visibility hidden 
        :not(:hover)::-moz-scrollbar, :not(:hover)::-moz-scrollbar-thumb
            visibility hidden
        // @media (pointer: fine)
</style>

