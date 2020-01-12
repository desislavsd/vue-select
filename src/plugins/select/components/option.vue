<script>

export default {
    name: 'Option',
    props: {
        option: {},
        index: {},
        state: {},
        tag: { default: 'span' }
    },
    computed: {
        classes(){
            return {
                '-marked': this.state.marked == this.option,
                '-selected': this.state.selected.includes(this.option),
            }
        }
    },
    render(h){

        let { classes, tag, option } = this;

        let sloted = this.$slots.default,
            single = sloted && sloted.length == 1 && sloted[0];

        if(single && single.tag){

            single.data = single.data || {};
            
            single.data.class = Object.assign({}, single.data.class, classes);

            return single
        }
            
        return h(tag, {class: classes}, sloted || [option.label])
    },
}

</script>