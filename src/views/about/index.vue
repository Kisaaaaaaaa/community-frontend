<template>
  <div class="about-page">
    <div class="card-box">
      <h1 class="page-title">关于平台</h1>
      <el-divider />

      <el-descriptions :column="isMobile ? 1 : 2" border>
        <el-descriptions-item label="平台名称">社区服务平台</el-descriptions-item>
        <el-descriptions-item label="技术栈">Vue 3 + Element Plus</el-descriptions-item>
        <el-descriptions-item label="适配终端">PC 端 / 移动端</el-descriptions-item>
        <el-descriptions-item label="布局方案">响应式布局</el-descriptions-item>
      </el-descriptions>

      <h2 class="section-title">设计理念</h2>
      <ul class="feature-list">
        <li>简洁直观：减少层级嵌套，核心功能一步可达</li>
        <li>适老化设计：基础字号 16px 起步，可点击区域不小于 44px</li>
        <li>响应式适配：自动识别设备类型，PC 侧边栏 / 移动端抽屉导航</li>
        <li>通用友好：支持键盘操作与屏幕阅读器</li>
      </ul>

      <h2 class="section-title">响应式断点</h2>
      <el-table :data="breakpoints" border>
        <el-table-column prop="name" label="断点" />
        <el-table-column prop="range" label="宽度范围" />
        <el-table-column prop="device" label="典型设备" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/store/app'

const { isMobile } = storeToRefs(useAppStore())

// 响应式断点说明数据
const breakpoints = [
  { name: 'xs', range: '≤ 768px', device: '手机竖屏' },
  { name: 'sm', range: '≤ 992px', device: '手机横屏 / 小平板' },
  { name: 'md', range: '≤ 1200px', device: '平板' },
  { name: 'lg', range: '> 1200px', device: '桌面' }
]
</script>

<style lang="scss" scoped>
.page-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  text-align: center;
}

.section-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin: var(--space-lg) 0 var(--space-md);
  padding-left: var(--space-sm);
  border-left: 4px solid var(--color-primary);
}

.feature-list {
  li {
    padding: var(--space-xs) 0;
    font-size: var(--font-size-base);
    color: var(--text-regular);
    line-height: 1.8;

    &::before {
      content: '✓';
      color: var(--color-success);
      margin-right: var(--space-sm);
      font-weight: bold;
    }
  }
}
</style>
