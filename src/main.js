import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false
global.Vue = Vue
// eslint-disable-next-line
Vue.prototype.log = console.log

new Vue({
  render: h => h(App),
}).$mount('#app')
