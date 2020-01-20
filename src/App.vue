<template>
  <div id="app">
    <form @submit.prevent="log('submit')">
      <ul>
        <li>when no $vnode.data.model -> persist via internal state</li>
        <li>prop allowed to check if option is allowed</li>
        <li>make smart Option and Selected components</li>
        <li>close dropdown on value change!</li>
        <li>prop prefill - function to process insufficient values that defaults to search('id1,id2..')</li>
      </ul>
      <!-- <v-select v-model="items" as="name:id:id" :from="browsers" @change="log($event)"  v-bind="attrs">
        <template v-slot:both="{ option }">
          {{option.label}}
        </template>
      </v-select> -->
      <!-- <v-select v-model="item" as="name:id:id" minlength="3" from="https://api.github.com/search/repositories?q=%s" parse="items"/> -->
      <v-select :value="selectedBrowser" stateful as="name:id:id" :from="getBrowsers">
        <template v-slot:both="{ option: { label }}">
          <strong>{{label}}</strong>
        </template>
      </v-select>
        <!-- from="https://api.github.com/search/repositories?q=%s"  -->

      <pre>{{selectedBrowsers}}</pre>

      <button @click.prevent="selectedBrowser = 2">Set browser</button>
      <div v-for="(val, attr) in attrs" :key="attr">
        <input type="checkbox" v-model="attrs[attr]"> {{attr}}
      </div>

      <label for=""> <input type="checkbox" v-model="error"> Error</label>
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
      selectedBrowsers: [2,3],
      selectedBrowser: undefined,//2,
      error: false,
      browsers: [
        {"id":1,"name":"Internet Explorer"},
        {"id":2,"name":"Firefox"},
        {"id":3,"name":"Chrome"},
        {"id":4,"name":"Opera"},
        {"id":5,"name":"Safari"}
      ],
      getBrowsers: function(){
        if(this.error) throw 1
        console.log('got browsers');
        
        return this.browsers
      }.bind(this),
    }
  },
  methods: {
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