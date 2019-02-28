<template>
    <button type="button" class="v-select-btn v-select-selected" tabindex="-1">
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
            line-height 0
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
</style>
