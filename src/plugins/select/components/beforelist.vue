<template>
    <div v-if="$parent.flags.loading" class="v-select-option">
        <slot>...</slot>
    </div>
</template>

