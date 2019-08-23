import vSelect from './components/select'

export * from './utils'

export { vSelect }

let VueSelect;

export default VueSelect = {

    install(Vue, { name = 'vSelect', mixin = {} } = {} ){

        Vue.component(name, {
            mixins: [vSelect, mixin]
        })
    },

    vSelect,
}

if(typeof window != 'undefined' && typeof window.Vue != 'undefined')
    window.VueSelect = VueSelect