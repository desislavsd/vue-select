<template>
  <div id="app">
    <form @submit.prevent="log('submit')">

      items: {{items}}
      <br>
      <br>
      <br>
      <v-select v-model="items" as="name:id:id" :tag-keys="[9, 32, 188]" options="/dist/repositories.json?q=" parse="items" />
      <br>
      <v-select v-model="item" as="name:id:id" :tag-keys="[9, 32, 188]" options="/dist/repositories.json?q=" parse="items" />
      <br>
      <br>
      <input type="text">
      <!-- item {{item}}
      <br>
      <v-select v-model="items" as="foo.bar::foo.bar" :options="[{foo: {bar: 1}}]" tagging autofocus/> -->

    </form>
  </div>
</template>

<script>

import { vSelect } from './plugins/select'

export default {
  name: 'app',
  components: { 
    vSelect: vSelect || { mixins: [vSelect], components: { vSelectOption: { functional: true, render(h, {slots}){
      return h('a', slots().default)
    }}} },

  },
  data(){
    return {
      item: undefined,
      items: [],
    }
  },
}
</script>
<style lang="stylus">
::-webkit-scrollbar
    width 5px
    background rgba(0,0,0,.1)
::-moz-scrollbar
    width 5px
::-webkit-scrollbar-thumb
    background: rgba(0,0,0,.2)
::-moz-scrollbar-thumb
    background: rgba(0,0,0,.2)
:not(:hover)::-webkit-scrollbar, :not(:hover)::-webkit-scrollbar-thumb
    visibility hidden 
:not(:hover)::-moz-scrollbar, :not(:hover)::-moz-scrollbar-thumb
    visibility hidden
#app
  font-family 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  color #2c3e50
</style>
