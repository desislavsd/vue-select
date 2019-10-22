<template>
    <div>
        <div class="v-select-bar">

            <slot name="selected" />

            <div class="v-select-inp-group">
                <slot name="input" />
                <slot name="actions" />
            </div>

        </div>

        <div class="v-select-list" ref="list">
            <slot name="beforelist" />
            <slot name="options" />
            <slot name="afterlist" />
        </div>

    </div>
</template>

<script>
export default {
    inject: ['select']
}
</script>

<style>
    /** 
     * since this component might be replace
     * styles should stay in the main component
     */ 
</style>