<template>
  <!-- 中文语言包：组件按需自动引入时，需用 el-config-provider 全局配置 locale -->
  <el-config-provider :locale="zhCn">
    <div class="app-container">
      <router-view />
    </div>
  </el-config-provider>
</template>

<script setup>
import zhCn from 'element-plus/es/locale/lang/zh-cn'

// 根组件：仅承载路由出口，布局由 Layout 组件统一管理
</script>

<style lang="scss" scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
  background-color: var(--app-bg-color, #f5f7fa);
}
</style>
