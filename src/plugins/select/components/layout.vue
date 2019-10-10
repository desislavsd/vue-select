<template functional>
    <div class="v-select" v-bind="data.attrs" v-on="listeners">
        
        <div class="v-select-bar">
            <slot name="selected"></slot>

            <slot></slot>
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

</style>