<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script setup>
// 根组件：仅承载路由出口，布局由 Layout 组件统一管理
</script>

<style lang="scss" scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
  background-color: var(--app-bg-color, #f5f7fa);
}
</style>
