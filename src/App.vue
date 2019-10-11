<template>
  <div id="app">
    <form @submit.prevent="log('submit')">

      <v-select v-model="items" as="name::id" from="https://api.github.com/search/repositories?q=%s" 
        parse="items" minlength=3>
        <template v-slot:selected="{option}">
          <div>
            {{option.raw.name}} <!-- <br>
            {{option.raw.id}} -->
          </div>
        </template>
      </v-select>

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
      item: undefined,
      items: [],
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