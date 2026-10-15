<template>
  <div class="not-found">
    <div class="content">
      <h1 class="code">404</h1>
      <p class="message">抱歉，您访问的页面不存在</p>
      <el-button type="primary" size="large" round class="btn-accessible" @click="$router.push('/')">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup>
// 404 页面
</script>

<style lang="scss" scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;

  .content {
    text-align: center;
  }

  .code {
    font-size: 96px;
    font-weight: 700;
    color: var(--color-primary);
    line-height: 1;
    margin-bottom: var(--space-md);
  }

  .message {
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    margin-bottom: var(--space-lg);
  }
}

.is-mobile {
  .not-found .code {
    font-size: 72px;
  }
}
</style>
