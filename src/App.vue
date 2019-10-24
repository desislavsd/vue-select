<template>
  <div id="app">
    <form @submit.prevent="log('submit')">

      <v-select v-model="item" tagging as="name:id:id" from="https://api.github.com/search/repositories?q=%s" 
        parse="items" minlength=3 v-bind="attrs">

        <template v-slot:option="{option}">
            <img :src="option.raw.owner.avatar_url" alt="" width="20">
            {{option.raw.id}}: <b>{{option.raw.name}}</b>
        </template>
      </v-select>

      <div v-for="(val, attr) in attrs" :key="attr">
        <input type="checkbox" v-model="attrs[attr]"> {{attr}}
      </div>

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
      attrs: {
        required: false,
        readonly: false,
        disabled: false,
      },
      query: 'vue',
      item: 11730342,
      items: [ 11730342, 24195339 ],
      browsers: ['Internet Explorer', 'Firefox', 'Chrome', 'Opera', 'Safari'],
      getBrowsers: function(){
        return this.browsers
      }.bind(this)
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
// :not(:hover)::-webkit-scrollbar, :not(:hover)::-webkit-scrollbar-thumb
//     visibility hidden 
// :not(:hover)::-moz-scrollbar, :not(:hover)::-moz-scrollbar-thumb
//     visibility hidden
#app
  font-family 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
</style>