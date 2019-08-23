<template>
  <div id="app">
    <form @submit.prevent="log('submit')">

      items: {{items}}
      <br>
      <br>
      <v-select v-model="items" as="name:id:id" from="https://api.github.com/search/repositories?q=%s" :tagging="maketag" parse="items" pattern=".{3,}" minlength=3 />
      <br>
      <!-- <v-select v-model="items" as="name:id:id" tagging from="/dist/repositories.json?q=" parse="items" /> -->
      <!-- <v-select v-model="item" :from="getBrowsers" :tag-keys="[9, 32, 188]"/> -->
      <br>
      {{query}}
      <!-- <v-select v-model="item" as="name:id:id" :tag-keys="[9, 32, 188]" from="/dist/repositories.json?q=" parse="items" /> -->
      <!-- item {{item}}
      <br>
      <v-select v-model="items" as="foo.bar::foo.bar" :from="[{foo: {bar: 1}}]" tagging autofocus/> -->

      <input type="text">
    </form>
  </div>
</template>

<script>

// eslint-disable-next-line
import { vSelect, model } from './plugins/select'

export default {
  name: 'app',
  components: { 
    // vSelect: vSelect,
  },
  data(){
    return {
      query: 'vue',
      item: undefined,
      items: [],
      browsers: ['Internet Explorer', 'Firefox', 'Chrome', 'Opera', 'Safari'],
      getBrowsers: function(){
        return this.browsers
      }.bind(this)
    }
  },

  methods: {
    async maketag(opt){

      console.log('Yahooo will make tag!!');
      opt = await new Promise(rs => {
        setTimeout(() => {
          rs({
            name: opt.label,
            id: 55555
          })
        }, 3000);
      })

      return opt
    }
  }
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
body
  background #f0f0f0
#app
  font-family 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
</style>
