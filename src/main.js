import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Element Plus 中文语言包
import zhCn from 'element-plus/es/locale/lang/zh-cn'

// Element Plus 暗黑模式样式（按需，此处预留）
import 'element-plus/theme-chalk/dark/css-vars.css'

// ElMessage / ElMessageBox 以 JS 方式调用，按需引入不会自动带上样式，需显式引入
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'

// 全局样式
import '@/assets/styles/index.scss'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 注入 Element Plus 语言包（组件已按需自动注册，仅配置 locale）
app.provide('locale', zhCn)

app.mount('#app')
