<template>
    <div class="v-select" v-bind="$attrs" v-on="$listeners">
        <div class="v-select-bar">

            <slot name="selected"></slot>

            <div class="v-select-inp-group">
                <slot></slot>
                <span v-if="$parent.state && $parent.state.loading">...</span>
                <button @mousedown="$parent.clear()" type="button" class="v-select-btn-close" tabindex="-1"></button>
                <button @click="$parent.open()" type="button" class="v-select-btn-dd" tabindex="-1"></button>
            </div>

        </div>

        <div class="v-select-list" ref="list">

            <slot name="options"></slot>
            
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
     * styles should probably stay in the main component
     */ 
</style>