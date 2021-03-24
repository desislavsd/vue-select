<!--
+ vue -> peerDependency
+ list padding should be items margin
+ clear query on blur to not be mistaken with selection
+ iterate over scopedSlots
+ make spinner appear in place of dd btn
+ add more slots in layout (before list, after list)

- change the error handler `utils.error`
- apply preloading logic on value change
- consider removing Option & Selected components
- option to disable backspace
- simplify caching
- push tags

* ? option groups
* add no results indicator
* reject current request when click on spinner
* more comments in the code
-->
<template>
    <Layout class="v-select" :class="classes" tabindex="-1" ref="layout"
        @mouseup.native.left="isMultiple && $refs.inp.focus()"
        @focusin.native="$refs.inp.focus() + checkFocus_()" 
        @focusout.native="checkFocus_()"
        @keydown.native.down.prevent="next()"
        @keydown.native.up.prevent="next(true)"
        @keydown.native.home.prevent="mark(0)"
        @keydown.native.end.prevent="mark(Infinity)"
        @keydown.native.esc.stop="~marked ? mark() : close()"
        @keydown.native.delete="onKeyDel()"
        @keydown.native.enter="onKeyDownEnter"
        @mousedown.native.left="open()">

        <!-- SELECTED -->
        <template v-slot:selected>
            <Selected v-for="(option,i) in value_" :key="option.index" v-bind="{ option, state, index: i, select: this }" @mouseup.left.native="deselect(i)" class="v-select-btn v-select-selected">
                <slot v-for="slot in ['both', 'selected']" :name="slot" v-bind="{ option, state, index: i, select: this }"/>
            </Selected>
        </template>
        
        <!-- SEARCH INPUT -->
        <template v-slot:input>
            <input ref="inp" class="v-select-inp" :placeholder="placeholder" v-model.trim="q" v-bind="$attrs" @focus="open().search()" @keydown="onKeyDown" @input="open()" />
        </template>

        <template v-slot:actions>
            <button @mouseup="clear()" class="v-select-btn-clear"   type="button" tabindex="-1"></button>
            <button @click="open()"      class="v-select-btn-dd"      type="button" tabindex="-1"></button>
            <button                      class="v-select-btn-spinner" type="button" tabindex="-1"><slot name="spinner"/></button>
        </template>
            
        <!-- OPTIONS -->
        <template v-slot:options>
            <Option v-for="(option, i) in filtered" :key="option.index" :ref="'option' + i" v-bind="{ option, state, index: i, select: this }" @mouseup.left.native="select(option)" class="v-select-option">
                <slot v-for="slot in ['both', 'option']" :name="slot" v-bind="{ option, state, index: i, select: this }" />
            </Option>
        </template>
        
        <template v-for="name in layoutSlots" v-slot:[name]="data">
            <slot :name="name" v-bind="{ state, select: this, ...data }"/>
        </template>

    </Layout>
</template>

<script>

import { mid, fetchAdapter, model, isset, debounce, me, error, msg, elMatches } from '../utils'

import Option from './option';
import Selected from './selected';
import Layout from './layout'

export default {
    name: 'Select',

    components: { Option, Selected, Layout },

    provide: { select(){ return this }, state(){ return this.state } },

    props: {

        /**
         * Make use of v-model
         */
        value: { },

        query: String,

        /**
         * Options for the dropdown. Sould be one of:
         * 
         * Array:     Array of select options
         * Function:  Function that returns an array of options or promise that resolves to an array of options
         * String:    Url that will be passed to the fetch function
         * Object:    Config object to be passed to the fetch function.
         */
        from: {
            type: [ Array, Function, String, Object ], 
            default(){ return [] } 
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
        as: [String, Array],

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
            default: async function(q, cfg){

                let url = cfg.url || cfg;
                
                return await fetchAdapter(url.replace('%s', encodeURIComponent(q)))
            },
        },

        filter: {
            type: [Boolean, Function],
            default: undefined
        },

        filterBy: {
            type: Function, 
            default( { label }, q ){
                return ~(label + '').toLowerCase().indexOf(q.toLowerCase())
            }
        },

        /**
         * Debounce in ms for the search function 
         */
        debounce: { type: Number, default: 250 },

        tagging: { type: [Boolean, Function] },

        multiple: { type: Boolean, default: undefined },
        
        dynamic: { type: Boolean, default: undefined },

        tags: {}, /* readonly */

        tagKeys: {type: Array, default: () => [] },
        
        validate: {
            type: Function,
            default(q){
                let { $attrs } = this;

                return  ( q || !$attrs.hasOwnProperty('minlength') ) && (!this.$refs.inp || elMatches(this.$refs.inp, ':valid'))
            }
        },

        watchAttrs: {default(){ return ['required', 'disabled', 'readonly']}},

        stateful: Boolean,

        find: { 
            type: [Function, Boolean], 
            default(vals){ 
                return this.from_( vals.filter(e => e.poor).map(e => e.label).join(',') )
            } 
        },
        closeOnSelect: {type: Boolean, default: undefined },
        clearOnSelect: {type: Boolean, default: undefined },
        clearOnClose: {type: Boolean, default: undefined },
    },

    inheritAttrs: false,

    data(){
        return {
            q: this.query || '',
            marked: -1,
            queue: null,
            flags: {
                loading: false,
                focused: false,
                opened: false,
            },
            value_: [],
            options: [],
            asSpec: { rx: /\s*[,:]\s*/, order: 'label:value:index'.split(':') },
            checkFocus_: debounce(10, this.checkFocus)
        }
    },

    computed: {
        isMultiple(){ 
            return this.multiple != undefined ? this.multiple : Array.isArray(this.value)
        },
        /**
         * whether the options list is received via getter function
         */
        isAsync(){ 
            return !Array.isArray(this.from) 
        },
        /**
         * whether the options list depends on the query
         */
        isDynamic(){ 
            let { from } = this;

            return  this.dynamic != undefined
                ? this.dynamic 
                : !!( 1
                    && ( !Array.isArray(from) )
                    && ( typeof from != 'string' || ~from.indexOf('%s') )
                    && ( typeof from != 'function' || from.length )
                )

            // return Boolean(!Array.isArray(from) && (typeof from != 'string' || ~from.indexOf('%s')))
        },
        /**
         * whether options are primitive
         */
        isPrimitive(){ 
            let { as_ } = this;

            return !as_ || !Object.values(as_).some(Boolean)
        },
        /**
         * whether values are insufficient to recreate an option object;
         * this is the case when label and value point to different 
         * properties of the option object
         */
        isInsufficient(){
            let { as_ } = this;

            return Boolean( as_ && as_.poor )
        },
        
        /**
         * getters & setters for the label, value and index
         */
        as_(){

            if(!this.as || !this.as.length) return;

            let as = Array.isArray(this.as) ? this.as : ( this.as || '' ).split(this.asSpec.rx);
            
            let poor = Boolean( as[0] && as[1] && (as[0] != as[1]) );

            as = this.asSpec.order
                .map( (e, i) => typeof as[i] == 'function' && as[i] || as[i] && model(as[i]) )
                .reduce( (m, e, i) => ({
                     ...m,  
                     [this.asSpec.order[i]]: e 
                }), { poor })

            if(!as.index) error('`index` field is required when working with non primitive options');

            return as;
        },
        
        filtered(){

            let { q } = this,
                filter = typeof this.filter == 'function' ? this.filter : this.filterBy;
            
            return (isset(this.filter) ? !!this.filter : (this.isDynamic || !q.length))
                ? this.options 
                : this.options.filter( option => {
                    return filter.call(this, option, q)
                })
        },

        state(){
            return {
                ...this.flags,
                multiple: this.isMultiple,
                searching: !!this.q,
                empty: !this.value_.length,
                marked: this.filtered[this.marked],
                selected: this.value_
            }
        },
        classes(){
            let { state, $attrs } = this;

            return {
                '-empty': state.empty, 
                '-opened': state.opened, 
                '-focused': state.focused,
                '-loading': state.loading, 
                '-multiple': state.multiple,
                '-selected': state.selected.length,
                '-searching': state.searching,
                ...this.watchAttrs.reduce( (m, attr) => ({...m, [`-${attr}`]: $attrs[attr]}), {} )
            }
        },
        debouncedSearch(){
            return debounce(this.debounce, this.search)
        },
        parse_(){

            return typeof this.parse == 'string' ? model(this.parse) : this.parse
        },
        placeholder(){
            return this.value_.length && !this.isMultiple ? '' : this.$attrs.placeholder || 'Search..'
        },
        matched(){

            let q = this.q.toLowerCase();
            
            return !q ? -1 : this.filtered.findIndex( e => (e.label + '').toLowerCase() == q )
        },
        layoutSlots(){
            let skip = 'selected options both input actions spinner'.split(' ');

            return Object.keys(this.$scopedSlots).filter( key => !skip.includes(key) )
        }
    },

    watch: {
        value: {
            immediate: true,
            async handler(value){

                this.value_ = this.parseValue(value)

                this.onChange();

                if( !this.value_.some( e => e.poor) ) return;

                if( !this.isDynamic ) return this.search();

                if( !this.find ) return;

                let options = await this.find(this.value_);

                this.value_ = this.parseValue(this.value_, options);
            }
        },

        from(){
            this.queue = null;
        },

        options(options){

            if(!options || !options.length) return;
            
            this.value_ = this.parseValue(this.value_)
        },

        value_: {
            immediate: true,
            handler(tags){
                this.$emit('update:tags', tags)
            }
        },

        filtered(){
            
            this.mark( this.isDynamic ? 0 : true )
        },

        q(query){

            if(this.isDynamic) this.options = [];

            this.debouncedSearch();
            this.$emit('update:query', query)
        },

        query(query){
            this.q = query || ''
        },

        queue(promise){
            
            this.flags.loading = promise && !!promise.finally( () => {
                if(promise == this.queue){
                    this.flags.loading = false;
                    
                }
            })
        },

        'flags.focused'(focus){
            this.$emit(focus ? 'focus' : 'blur', this);
            return focus ? this.open() : this.close(isset(this.clearOnClose) ? this.clearOnClose : true);
        },

        'flags.opened'(opened){ this.$emit(opened ? 'open' : 'close', this); }
    },

    methods: {

        /**
         * Updates the model value 
         * handling both v-model & no v-model cases
         */
        set(value){

            if( this.stateful ) {
                this.value_ = isset(value) ? Array.isArray(value) ? value : [value] : [];
                this.onChange();
            }

            if( isset(value) )
                value = Array.isArray(value) ? value.map( v => v.value ) : value.value;

            this.$emit('input',  value )
        },
        
        async search( force = false ){
            
            let { q } = this, queue, options;

            if( typeof force == 'string' ) q = force;

            // proceed only if query is valid
            if( !this.validate(q) ) return new Error(msg('Invalid query: ' + q));
            
            queue = this.queue = !force && this.queue && (!this.isDynamic || ( this.queue.q == q) )
                ? this.queue // request is cached
                : this.from_(q)
            
            queue.q = q; // remember what `q` was this request associated with

            try { options = await queue } catch ( ex ) {
                if(queue == this.queue) this.queue = null;
                throw ex;
            }

            // disregard the request if it is no longer relevant
            if( (queue != this.queue) || (this.q != this.queue.q) ) return;
            
            this.options = options;
        },
        
        async from_(q){
            let { from, fetch } = this, res;

            if( Array.isArray(from) ) res = from;
            // this.options = [];
            
            else if(typeof from == 'function') res = await from(q)
            
            else res = await fetch(q, from);

            return (this.parse_(res) || []).map( option => this.ofRaw(option) )
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

            return new VSelectOption(option);
        },

        /**
         * Construct v-select option from raw option's value
         */
        ofValue(value){

            let { isInsufficient } = this;

            if(this.isPrimitive) return this.ofRaw(value);

            let raw = value, as = this.as_;

            as && as.value && as.value(raw = {}, value);
            
            let option = this.ofRaw(raw);
            
            return Object.assign(option, { poor: isInsufficient });
        },

        /**
         * Construct v-select option from phrase
         */
        ofPhrase(q){

            let { isInsufficient } = this;

            if(this.isPrimitive) return this.ofRaw(q);

            let raw = {}, as = this.as_;

            as.value && as.value(raw, q)
            
            as.label && as.label(raw, q)
            
            return Object.assign(this.ofRaw(raw), { poor: isInsufficient, new: true });
        },

        async select(option, fresh = false ){

            let index = this.value_.findIndex( e => this.equals(e, option) );

            this.$emit('select', option);

            // selecting already selected options will deselect them in multiple mode
            if( ~index ) 
                return this.isMultiple ? this.deselect(index) : this
            
            if( fresh ){
                this.$emit('create', option);
                
                if( !this.tagging ) return;
                
                if(typeof this.tagging == 'function'){
                    
                    let res = await this.tagging.call(this.$parent, option, this);
                    
                    if([false].includes(res)) return;

                    option = res instanceof VSelectOption ? res : this.ofRaw(res);
                }
            }
            
            if(this.isMultiple) 
                option = this.value_.concat(option)
            
            this.set(option);
        },

        /**
         * Deselect option by its index
         * @param {Number} index Index of the option in `value_`
         */
        deselect(index){

            if(!this.isMultiple) return this.clear();

            let value = [...this.value_];

            value.splice(index,1);

            this.set(value)
        },

        /**
         * Clears model value
         */
        clear(){

            this.set(this.isMultiple ? [] : undefined)
        },
        
        /**
         * Check if option is already selected
         * @param {Object} option option to be checked
         */
        exists(option){

            return this.value_.some( e => this.equals(e, option))
        },

        /**
         * Maps provided value to exisiting in the options list
         * vSelectOptions if possible
         */
        parseValue(value, options){

            if(!isset(value)) return [];

            options = options || this.options.concat(this.value_);

            return [].concat(value)
                .map( v => v instanceof VSelectOption ? v : this.ofValue(v) )
                .map( v => options.find( o => this.equals(v, o)) || v )
        },

        /**
         * Mark an option at given index for selection.
         * @param {Number, Boolean} i Index of the option to be marked or `true` to mark the exact match with `q`
         */
        mark(i){
            // use false/true to mark first/last option
            if(!arguments.length || i === false) i = -1

            // use `true` to marke matched or first item when no tagging
            else if ( i === true ) i = ~this.matched ? this.matched : this.tagging ? -1 : 0 ;

            // assure `i` is a valid index
            i = this.marked = mid(-1, i, this.filtered.length - 1);

            if(~i){
                let li = this.$refs['option' + i]; li = li && li[0] && li[0].$el;

                // scroll to marked element
                if(li) this.scrollTo(li)
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

            if( a.index === b.index ) return true;

            if( a.index == b.index && [a.index, b.index].every(isset) ) return true;
            
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

        close(clearQuery){
            this.flags.opened = false; 
            if(clearQuery || (isset(this.clearOnSelect) ? this.clearOnSelect : !this.isMultiple) ) this.q = '';
            return this; 
        },

        blur(){

            if(!this.$el) return this;

            let el = elMatches(this.$el, ':focus') ? this.$el : this.$el.querySelector(':focus');

            return el && el.blur(), this;
        },

        scrollTo(el){
            let list = this.$refs.layout.$refs.list;

            list.scrollTop = Math.round(el.offsetTop + el.offsetHeight - list.offsetHeight/2)
            // li.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'nearest'})
        },

        checkFocus(){

            this.flags.focused = elMatches(this.$el, ':focus') || !!this.$el.querySelector(':focus');

            return this;
        },

        onKeyDel(){

            if(this.q) return;

            let len = this.value_.length;

            len && this.isMultiple ? this.deselect(len - 1) : this.clear();
        },

        onKeyDownEnter(ev){

            if(!this.q && !~this.marked) return;
            
            ev.preventDefault();

            let option = this.filtered[this.marked];
            
            this.select(option || this.ofPhrase(this.q), !option);
        },
        
        onKeyDown(ev){
            
            if( !this.tagging 
                || !this.q 
                || !this.tagKeys.includes(ev.which || ev.keyCode || 0)
                || (~this.marked && this.filtered[this.marked].label === this.q)
            ) return;
            
            ev.preventDefault(), ev.stopPropagation();

            this.select(this.ofPhrase(this.q));
        },
        onChange(){
            if(isset(this.closeOnSelect) ? this.closeOnSelect : !this.isMultiple || this.isDynamic ) this.close();
            if(isset(this.clearOnSelect) ? this.clearOnSelect : 1) this.q = '';
            this.$emit('change', this.isMultiple ? setRaw(this.value_) : this.value_[0] )
        },
    },
}

function VSelectOption(){
    Object.assign(this, ...arguments)
}
function setRaw(arr){

    return  arr = [...arr], 
            arr.raw = arr.map( e => e.value ), 
            arr
}
</script>
<style lang="stylus">
    // TODO: add css variables for theming
    .v-select
        --c-base: #fff
        --c-theme: #f0f0f0
        --c-border: #ccc
        --radius: 0.2em
        --padd: 3px
        --height: 3em
        font-size 12px
        &, *, :before, :after
            box-sizing border-box
            margin 0

    .v-select
        position relative
        outline none
        padding: var(--padd)
        border 1px solid var(--c-border)
        border-radius: var(--radius)
        background var(--c-base)
        button, input
            font inherit
            text-align left

        // options
        .v-select-option
            display flex
            align-items center
            padding .3em 0.5em
            cursor pointer
            &.-marked 
                background rgba(0,0,0,.05)
            &:hover
                background rgba(0,0,0,.03)
            &.-selected
                opacity 0.5

        // selected
        .v-select-selected
            display flex
            align-items center
            position absolute
            overflow hidden
            text-overflow ellipsis
        &.-multiple .v-select-selected
            background var(--c-theme)
            border-color rgba(0,0,0,.1)
            position static
        &.-searching:not(.-multiple) .v-select-selected
            opacity 0
        &:not(.-multiple):not(.-searching) 
            &.-opened, &.-focused
                .v-select-selected
                    opacity 0.6
                    
        .v-select-selected
            margin-right: var(--padd)
            margin-bottom: var(--padd)
            &:first-of-type
                border-radius: var(--radius) 0 0 var(--radius)
        // bar
        .v-select-bar
            position relative
            height 100%
            display flex
            flex-wrap wrap
            align-items stretch
            white-space nowrap
            margin-bottom: calc(0px - var(--padd))
        .v-select-inp-group
            display flex
            margin-bottom var(--padd)
            flex 1
            min-width 10em
        &:not(.-opened) .v-select-list
            visibility hidden
        .v-select-inp
            flex 1
            border none
            background none
            padding 0 .5em
            outline none
            position relative
            z-index 1
            min-width 0
            &[readonly]
                cursor default
        [class*="v-select-btn"], .v-select-inp
            min-height: calc(var(--height) - var(--padd)*2 - 2px) // substract bar paddings and borders
        [class*="v-select-btn"]
            padding 0.2em 0.5em
            background transparent
            border 1px solid transparent
            cursor pointer
            outline none
            line-height 1em
        
        &:not(.-loading) .v-select-btn-spinner
            display none
        .v-select-btn-spinner
            &:before
                content ''
                border 2px solid var(--c-theme)
                border-left-color var(--c-border)
                border-radius 100%
                transform translateZ(0)
                animation vSelectSpinner .4s linear infinite
                transition opacity .1s
                width 1em
                height 1em
                display block
        .v-select-btn-clear
            &:before
                content '\2716'
                font-size .8em
            &:not(:hover)
                opacity 0.6
        .v-select-btn-dd:before
                content: ''
                display: block;
                border: solid transparent;
                border-top-color: #000;
                border-width: 0.5em 0.3em 0;
                opacity: .8;
                margin 0 .2em
        &.-empty .v-select-btn-clear
            display none
        &.-opened .v-select-btn-dd 
            opacity .6
        &.-loading .v-select-btn-dd
            display none

        .v-select-list
            list-style none
            z-index 4
            position absolute
            left -1px
            right -1px
            padding 0
            max-height 200px
            overflow hidden
            overflow-y auto
            border inherit
            padding inherit
            padding-top 0
            padding-bottom 0
            background inherit
            box-shadow inherit
            // > :first-child
            //     margin-top var(--padd)
            > :last-child
                margin-bottom var(--padd)

        &:not(.-top)
            &.-opened
                box-shadow 0 3px 3px -1px rgba(0,0,0,0.16)
                border-radius: var(--radius) var(--radius) 0 0
            .v-select-list
                top 100%
                margin-top -1px
                border-top-color transparent
                border-radius: 0 0 var(--radius) var(--radius)
                padding-top 0
        &.-top
            &.-opened
                box-shadow 0 -3px 3px -1px rgba(0,0,0,0.16)
                border-radius: 0 0 var(--radius) var(--radius)
            .v-select-list
                bottom 100%
                margin-bottom -1px
                border-bottom-color transparent
                border-radius: var(--radius) var(--radius) 0 0
                padding-bottom 0

    @keyframes vSelectSpinner 
        0%
            transform rotate(0deg)
        to 
            transform rotate(1turn)

</style>

