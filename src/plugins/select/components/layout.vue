<template>
    <div v-bind="$attrs" v-on="$listeners">
        <div class="v-select-bar">

            <slot name="selected"></slot>

            <div class="v-select-inp-group">
                <slot></slot>
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