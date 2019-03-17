import vSelect from './components/select'

export * from './utils'

export { vSelect }

let VueSelect;

export default VueSelect = {

    install(Vue, { name = 'vSelect', mixin = {} } = {} ){

        Vue.component(name, {
            mixins: [mixin, vSelect]
        })
    },

    vSelect,
}

if(typeof window != 'undefined' && typeof window.Vue != 'undefined')
    window.VueSelect = VueSelect