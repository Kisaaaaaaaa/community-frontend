<template>
  <div class="auth-page">
    <div class="auth-card" :class="{ shake: shaking }">
      <!-- 品牌区 -->
      <div class="auth-brand">
        <el-icon :size="40" color="#409eff"><HomeFilled /></el-icon>
        <h1 class="auth-title">社区服务平台</h1>
        <p class="auth-subtitle">请选择身份并输入账号信息登录</p>
      </div>

      <!-- 身份切换：仅影响账号校验规则与提示，不改变接口 -->
      <el-radio-group
        v-model="form.identity"
        class="identity-group"
        @change="onIdentityChange"
      >
        <el-radio-button value="user">居民 / 工作人员</el-radio-button>
        <el-radio-button value="admin">管理员</el-radio-button>
      </el-radio-group>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @submit.prevent
      >
        <el-form-item label="登录账号" prop="username">
          <el-input
            v-model="form.username"
            :placeholder="usernamePlaceholder"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item label="登录密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入登录密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="submit-btn"
            :loading="loading"
            round
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="auth-footer">
        <span>还没有账号？</span>
        <router-link to="/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { HomeFilled, Lock, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const shaking = ref(false)
let shakeTimer = null

// 触发卡片抖动动效（校验失败或登录失败时）
async function triggerShake() {
  shaking.value = false
  await nextTick()
  shaking.value = true
  clearTimeout(shakeTimer)
  shakeTimer = setTimeout(() => {
    shaking.value = false
  }, 500)
}

const form = reactive({
  identity: 'user', // user：居民/工作人员；admin：管理员
  username: '',
  password: ''
})

// 校验规则（与接口要求一致）
const phonePattern = /^1[3-9]\d{9}$/ // 居民/工作人员：11 位手机号
const staffNoPattern = /^[A-Za-z][A-Za-z0-9]{2,19}$/ // 管理员：字母开头、3~20 位
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/ // 8~20 位，须含字母与数字

const usernamePlaceholder = computed(() =>
  form.identity === 'admin' ? '请输入管理员工号' : '请输入 11 位手机号'
)

const rules = computed(() => ({
  username: [
    { required: true, message: usernamePlaceholder.value, trigger: 'blur' },
    form.identity === 'admin'
      ? { pattern: staffNoPattern, message: '工号为字母开头、3~20 位（字母或数字）', trigger: 'blur' }
      : { pattern: phonePattern, message: '请输入正确的 11 位手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { pattern: passwordPattern, message: '密码为 8~20 位，且须包含字母与数字', trigger: 'blur' }
  ]
}))

// 切换身份时清空账号，避免沿用上一种身份的输入
function onIdentityChange() {
  form.username = ''
  formRef.value?.clearValidate('username')
}

async function handleLogin() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    // 字段校验不通过：抖动提醒（字段下方同时显示错误文案）
    triggerShake()
    return
  }

  loading.value = true
  try {
    await userStore.login({
      username: form.username.trim(),
      password: form.password
    })
    ElMessage.success('登录成功')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
    router.replace(redirect)
  } catch {
    // 账号或密码错误等：请求拦截器已弹出错误提示，这里补一个抖动作反馈
    triggerShake()
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.auth-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  background: url('../../assets/background.jpg') center / cover no-repeat;

  // 半透明蒙层：降低背景干扰，突出登录卡片
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
  }
}

.auth-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
  background: var(--card-bg-color);
  border-radius: var(--radius-lg);
  padding: var(--space-xl) var(--space-lg);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

// 登录失败时的抖动动效
.auth-card.shake {
  animation: card-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes card-shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-6px); }
  40%, 60% { transform: translateX(6px); }
}

.auth-brand {
  text-align: center;
  margin-bottom: var(--space-lg);

  .auth-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
    margin-top: var(--space-sm);
  }

  .auth-subtitle {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-top: var(--space-xs);
  }
}

.identity-group {
  width: 100%;
  margin-bottom: var(--space-lg);

  :deep(.el-radio-button) {
    flex: 1;

    .el-radio-button__inner {
      width: 100%;
    }
  }
}

.submit-btn {
  width: 100%;
  min-height: 44px; // 适老化：更大可点击区域
  font-size: var(--font-size-base);
  letter-spacing: 4px;
}

.auth-footer {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: var(--space-md);
}
</style>
