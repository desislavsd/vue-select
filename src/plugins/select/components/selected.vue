<template>
    <button type="button" tabindex="-1" class="v-select-btn v-select-selected" @mouseup.left="$emit('deselect')">
        <slot>{{option.label}}</slot>
    </button>
</template>

<script>
export default {
    name: 'Selected',
    props: ['option', 'index']
}
</script>
<style lang="stylus">
    .v-select
        .v-select-selected
            display flex
            align-items center
            position absolute
            overflow hidden
            text-overflow ellipsis
        &.--multiple .v-select-selected
            background var(--c-theme)
            border-color rgba(0,0,0,.1)
            position static
        &.--searching:not(.--multiple) .v-select-selected
            opacity 0
        &.--opened:not(.--multiple):not(.--searching) .v-select-selected
            opacity 0.6
        &:focus-within:not(.--multiple):not(.--searching) .v-select-selected
            opacity 0.6
</style>
