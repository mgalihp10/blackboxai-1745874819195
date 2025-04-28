import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'
import '@fortawesome/fontawesome-free/css/all.css'

import BootstrapVue3 from 'bootstrap-vue-3'

const app = createApp(App)
app.use(store)
app.use(router)
app.use(BootstrapVue3)
app.mount('#app')
