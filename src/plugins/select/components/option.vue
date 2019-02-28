<template>
    <a class="v-select-option" :class="classes"><slot>{{option.label}}</slot></a>
</template>

<script>
export default {
    name: 'Option',
    props: ['option', 'index', 'state'],
    computed: {
        classes(){
            return {
                '-marked': this.state.marked == this.option,
                '-selected': this.state.selected.includes(this.option),
            }
        }
    }
}
</script>
<style lang="stylus">
    .v-select-option
        display block
        padding .3em 0.5em
        cursor pointer
        &:hover
            background #fafafa
        &.-marked 
            background #f0f0f0
        &.-selected
            opacity 0.5
</style>