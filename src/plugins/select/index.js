import vSelect from './components/select'
import vSelectOption from './components/option'
import vSelectSelected from './components/selected'
import vSelectLayout from './components/layout'

export { vSelect, vSelectLayout, vSelectOption, vSelectSelected }

let VueSelect;
import { version } from '@/../package.json'

export default VueSelect = {

    version, 
    
    install(Vue, { name = 'vSelect', mixin = {} } = {} ){

        Vue.component(name, {
            mixins: [vSelect, mixin]
        })
    },

    vSelect, vSelectLayout, vSelectOption, vSelectSelected
}

if(typeof window != 'undefined' && typeof window.Vue != 'undefined')
    window.VueSelect = VueSelect