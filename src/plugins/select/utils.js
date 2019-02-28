export async function fetchAdapter(url = '') {
    let res = await fetch(url);

    if (!res.ok) return Promise.reject(res);

    return await res.json();
}

export function mid(min, val, max) {

    return Math.min(Math.max(min, val), max)
}

export function set(path, o, val) {

    path = parsePath(path)
    
    return arguments.length > 2 
        ? (get(path.slice(0, -1), o, {})[path[path.length-1]] = val)
        : get(path, o)
}

export function get(path, o, val){
    path = parsePath(path)

    let i = -1, len = path.length, set = arguments.length > 2;
    
    while (++i < len){
        let g = o; o = o[path[i]];

        if(typeof o == 'object') continue;
        
        if(!set) return i == len - 1 ? o : undefined;

        o = g[path[i]] = i < len - 1 ? {} : isPrimitive(g[path[i]]) ? val : g[path[i]];
    }
    return o
}

export function model(path, ...args){
    path = parsePath(path);

    return set.bind(null, path, ...args)
}

export function isset(x){
    return ![undefined, '', null, NaN].includes(x);
}

export function isPrimitive(x) {
    return x !== Object(x);
}

export function error() {
    // eslint-disable-next-line
    console.error('[VueSelect]: ', ...arguments)
}

export function debounce(t, f, defaults) {

    var timeout;

    function handler(...args) {

        clearTimeout(timeout);

        timeout = setTimeout(() => f.apply(this, args), t)

        return defaults;
    }

    return t ? handler : f;
}

export let me = e => e;

function parsePath(path){

    return Array.isArray(path) ? path : path.split('.').filter(Boolean)
}