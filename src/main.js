import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false
global.Vue = Vue

import VueSelect from './plugins/select'
// let VueSelect = require('!!../dist/vue-select.common.js').default

Vue.use(VueSelect, {
  mixin: {
    
  }
})
// eslint-disable-next-line
Vue.prototype.log = console.log

new Vue({
  render: h => h(App),
}).$mount('#app')
