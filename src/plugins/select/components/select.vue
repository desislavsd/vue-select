<template>
    <div class="v-select" :class="classes" tabindex="-1" 
        @focus="$refs.inp.focus()"
        @mouseup.left="is_multiple && $refs.inp.focus()"
        @focusin="checkFocus_()" 
        @focusout="checkFocus_()"
        @keydown.down.prevent="next()"
        @keydown.up.prevent="next(true)"
        @keydown.home.prevent="mark(0)"
        @keydown.end.prevent="mark(Infinity)"
        @keydown.esc="mark().close()"
        @keydown.delete="onDelKey()"
        @keydown.enter="onKeyDownEnter"
        @mousedown.left="open()">

        <div class="v-select-bar">
            
            <!-- SELECTED -->
            <component :is="selectedComponent" v-for="(option,i) in value_" :key="option.index" :option="option" :index="i" @mouseup.left.native="deselect(i)">
                <slot name="selected" :option="option" :index="i" />
            </component>

            <!-- SEARCH INPUT -->
            <input ref="inp" v-model.trim="q" v-bind="$attrs" class="v-select-inp"
                @focus="open().search()" @keydown="onKeyDown" @input="open()" :placeholder="placeholder" />

            <!-- ACTION BUTTONS -->
            <button @mousedown="clear()" type="button" class="v-select-btn-close" tabindex="-1"></button>
            <button @click="open()" type="button" class="v-select-btn-dd" tabindex="-1"></button>
            
        </div>

        <div class="v-select-list">
            <component :is="loaderComponent" v-if="flags.fetching" :phrase="queue.q"><slot name="loader" :phrase="queue.q" /></component>

            <component :is="optionComponent" v-for="(option, i) in filtered" :key="option.index" :ref="'option' + i" :option="option" :index="i" :state="state" @mouseup.left.native="select(option)">
                <slot name="option" :option="option" :index="i" :state="state"/>
            </component>
        </div>

    </div>
</template>

<script>
/**
 * TODO:
 * - pagination
 * 
 * - when hold down backspace/delete delete only q & 
 *   wait for another press to clear tags/value
 */

import { mid, fetchAdapter, model, isset, debounce, me, error } from '../utils'

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

        optionComponent: { default: 'vSelectOption' },
        selectedComponent: { default: 'vSelectSelected' },
        loaderComponent: { default: 'vSelectLoader' },
    },

    inheritAttrs: false,

    data(){
        return {
            q: '',
            marked: -1,
            queue: null,
            flags: {
                loading: false,
                focused: false,
                opened: false,
            },
            value_: [],
            options_: [],
            asSpec: { rx: /\s*[,:]\s*/, order: 'label:value:index'.split(':') },
            checkFocus_: debounce(10, this.checkFocus)
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

            let as = this.as && this.as.split(this.asSpec.rx);

            if(!as) return;
            
            as = this.asSpec.order
                .map( (e, i) => as[i] && model(as[i]) )
                .reduce( (m, e, i) => ({ ...m,  [this.asSpec.order[i]]: e }), {})

            as.index = as.index || as.value || error('`index` field is required when working with non primitive options');

            return as;
        },
        
        filtered(){

            let { q } = this;
            
            return this.is_dynamic || !q.length 
                ? this.options_ 
                : this.options_.filter( option => {
                    return this.filter(option, q)
                })
        },

        state(){
            return {
                ...this.flags,
                multiple: this.is_multiple,
                searching: !!this.q,
                empty: !this.value_.length,
                marked: this.filtered[this.marked],
                selected: this.value_
            }
        },
        classes(){
            let { state } = this;
            return {
                '-empty': state.empty, 
                '-opened': state.opened, 
                '-focused': state.focused,
                '-loading': state.loading, 
                '-multiple': state.multiple,
                '-selected': state.selected.length,
                '-searching': state.searching,
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
        },
        matched(){

            let q = this.q.toLowerCase();
            
            return !q ? -1 : this.filtered.findIndex( e => (e.label + '').toLowerCase() == q )
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

        options_: 'syncValue',

        filtered(){
            
            this.mark(true)
        },

        q: 'debouncedSearch',

        queue(promise){
            
            this.flags.fetching = promise && !!promise.finally( () => this.flags.fetching = promise != this.queue )
        },

        'flags.focused'(focus){
            return focus ? this.open() : this.close();
        }
    },

    methods: {
        async search(){

            let { options, q } = this, queue;
            
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

        /**
         * Construct v-select option from raw option
         */
        ofRaw(raw){

            let as = this.as_;

            let option = this.asSpec.order.reduce((m, e) => ({
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

        /**
         * Construct v-select option from raw option's value
         */
        ofValue(value){

            if(this.is_primitive) return this.ofRaw(value);

            let raw = value, as = this.as_;

            as && as.value && as.value(raw = {}, value);
            
            let option = this.ofRaw(raw);
            
            return option;
        },

        /**
         * Construct v-select option from phrase
         */
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

        /**
         * Deselect option by its index
         * @param {Number} index Index of the option in `value_`
         */
        deselect(index){

            if(!this.is_multiple) return this.clear();

            let value = [...this.value];

            value.splice(index,1);

            this.$emit('input', value)
        },

        /**
         * Clears model value
         */
        clear(){

            this.$emit('input', this.is_multiple ? [] : undefined)
        },
        
        /**
         * Check if option is already selected
         * @param {Object} option option to be checked
         */
        exists(option){

            return this.value_.some( e => this.equals(e, option))
        },

        /**
         * Calculates `value_` from model's value
         */
        syncValue(){
            
            if(!isset(this.value)) return this.value_ = [];

            let options = this.options_.concat(this.value_);
            
            return this.value_ = [].concat(this.value).map( val => this.ofValue(val) )
                .map( val => options.find( option => this.equals(val, option) ) || val );
        },

        /**
         * Mark an option at given index for selection.
         * @param {Number, Boolean} i Index of the option to be marked or `true` to mark the exact match with `q`
         */
        mark(i){
            // use false/true to mark first/last option
            if(!arguments.length || i === false) i = -1
            else if ( i === true ) i = this.matched;

            // assure `i` is a valid index
            i = this.marked = mid(-1, i, this.filtered.length - 1);

            if(~i){
                let li = this.$refs['option' + i];
                li && li[0] && (li[0].$el || li[0]).scrollIntoView({behavior: 'smooth'})
            }
            
            return this;
        },

        /**
         * Marks next/previous option of the current marked option
         */
        next(prev = false){
            if(!this.flags.opened) return this.open()
            this.mark(this.marked + (-1)**prev)
        },

        /**
         * Checks if two options are equal
         */
        equals(a,b){

            if(a.index === b.index) return true;
            
            try {
                return JSON.stringify(a.index) === JSON.stringify(b.index)
            } catch(ex){
                return false
            }
        },

        open(){ 
            if(this.flags.opened) return this;
            this.flags.opened = true; 
            return this.mark(true); 
        },

        close(){
            this.flags.opened = false; 
            if(!this.is_multiple) this.q = '';
            return this; 
        },

        blur(){

            if(!this.$el) return this;

            let el = this.$el.matches(':focus') ? this.$el : this.$el.querySelector(':focus');

            return el && el.blur(), this;
        },

        checkFocus(){

            let focus = this.$el.matches(':focus') || !!this.$el.querySelector(':focus');

            if( this.flags.focused != focus ) {
                this.flags.focused = focus;
            }
            
            return this;
        },

        onDelKey(){

            if(this.q) return;

            let len = this.value_.length;

            len && this.is_multiple ? this.deselect(len - 1) : this.clear();
        },

        onKeyDownEnter(ev){

            if(!this.q && !~this.marked) return;
            
            ev.preventDefault();

            let option = this.filtered[this.marked];
            
            this.select(option || this.ofPhrase(this.q), !option);
        },
        
        onKeyDown(ev){
            
            if( !this.is_tagging 
                || !this.q 
                || !this.tagKeys.includes(ev.which || ev.keyCode || 0)
                || (~this.marked && this.filtered[this.marked].label === this.q)
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
    .v-select
        --c-base: #fff
        --c-theme: #f0f0f0
        --c-border: #ccc
        --radius: 1.5em
        --radius: 0.2em
        --padd: 3px
        font-size 12px
        &, *, :before, :after
            box-sizing border-box
            margin 0

    .v-select
        position relative
        outline none
        height 3em
        padding: var(--padd)
        border 1px solid var(--c-border)
        border-radius: var(--radius)
        background var(--c-base)
        .v-select-selected
            &:first-of-type
                border-radius: var(--radius) 0 0 var(--radius)
            &:nth-of-type(n+2)
                margin-left: var(--padd)
        .v-select-bar
            position relative
            height 100%
            display flex
            align-items stretch
            white-space nowrap
        &.-opened
            box-shadow 0 3px 6px rgba(0,0,0,0.16)
            border-radius: var(--radius) var(--radius) 0 0
        &:not(.-opened) .v-select-list
            visibility hidden
        .v-select-inp
            flex 1
            min-width 40%
            border none
            background none
            padding 0 .5em
            outline none
            position relative
            z-index 1
            line-height 0
            &[readonly]
                cursor default
        [class*="v-select-btn"]
            padding 0 0.5em
            height 100%
            background transparent
            border 1px solid transparent
            cursor pointer
            outline none
            line-height 0
        
        .v-select-btn-close
            &:before
                content '\00D7'
                font-size 1.2em
            &:not(:hover)
                opacity 0.6
        .v-select-btn-dd:before
                content: ''
                display: block;
                border: solid transparent;
                border-top-color: #000;
                border-width: 0.5em 0.3em 0;
                opacity: .8;
        &.-empty .v-select-btn-close
            display none
        &.-opened .v-select-btn-dd 
            display none

        .v-select-list
            list-style none
            z-index 4
            position absolute
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
            border-radius: 0 0 var(--radius) var(--radius)
</style>

