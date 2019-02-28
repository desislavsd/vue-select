# vue-select

Lightweight and mighty select component like [Chosen](https://harvesthq.github.io/chosen/) and [Select 2](https://select2.org/) done the Vue way.

Main features: 

- **uses** `v-model`
- **Single/Multiple selection**
- **Tagging + custom triggering keys**
- **List Filtering / Searching**
- **Async options list**
- **AJAX out of the box using `fetch`**
- **Debounce AJAX requests**
- **Transparent access to input attributes**
- **Highly customizable**
- **Zero dependencies**

### Usage

```shell
$ npm i @desislavsd/vue-select
```

```javascript
import VueSelect from '@desislavsd/vue-select'
import { vSelect } from '@desislavsd/vue-select'

Vue.use(VueSelect) // registers <v-select/> globally
```

```html
<v-select v-model="user" :options="['John', 'Erik']" />

<!-- select multiple if the model is an array -->
<v-select v-model="users" as="name.first:id" options="/users" />
```

#### Props

- `options` - specifies selector's options. Can be:
  - `Array` - an array of options
  - `String` - *url* be passed to the `fetch` function
  - `Object`- options to be passed to the `fetch` function
  - `Function` - function that returns options array or Promise that resolves to options array

- `as` - List of  `":"` separated paths. Useful when selector options are objects to specify paths to properties for **label**, **value** & **index** of the option. Paths are separated with `":"`.
  - **label*** - label is used for filtering the options and is also the default display name of the option. This path is required when working with non primitive options.
  - **value** - path to property to be used as a value. If omitted the whole object is used.
  - **index** - path to unique property that can be used for comparison and as a key in a `v-for`

#### Events



## License

MIT License

Copyright (c) 2017

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.