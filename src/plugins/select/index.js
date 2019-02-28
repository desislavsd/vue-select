import vSelect from './components/select'

export * from './utils'

export { vSelect }

let installed = 0, Plugin;

export default Plugin = {

    install(Vue, { name = 'vSelect', mixin = {} } = {} ){

        if(installed++) return;
        
        Vue.component(name, {
            mixins: [mixin, vSelect]
        })
    }
}

if(typeof window != 'undefined' && typeof window.Vue != 'undefined')
    window.Vue.use(Plugin)