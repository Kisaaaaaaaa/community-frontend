<template>
  <div class="auth-page">
    <div class="auth-card" :class="{ shake: shaking }">
      <!-- 品牌区 -->
      <div class="auth-brand">
        <el-icon :size="40" color="#409eff"><HomeFilled /></el-icon>
        <h1 class="auth-title">账号注册</h1>
        <p class="auth-subtitle">居民注册后即可登录，工作人员需管理员审核</p>
      </div>

      <!-- 角色切换：管理员不支持自助注册 -->
      <el-radio-group v-model="form.role" class="identity-group">
        <el-radio-button value="resident">居民</el-radio-button>
        <el-radio-button value="staff">社区工作人员</el-radio-button>
      </el-radio-group>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @submit.prevent
      >
        <!-- 两列布局：PC 端并排展示，窄屏自动堆叠为单列 -->
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="form.realName" placeholder="请输入真实姓名" :prefix-icon="User" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="手机号" prop="phone">
              <el-input
                v-model="form.phone"
                placeholder="请输入 11 位备案手机号"
                :prefix-icon="Iphone"
                maxlength="11"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="field-tip">手机号将作为登录账号，请确保已备案</div>

        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="登录密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="8~20 位，须包含字母与数字"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="请再次输入登录密码"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="住址（选填）" prop="address">
          <el-input
            v-model="form.address"
            placeholder="请输入住址"
            :prefix-icon="LocationInformation"
            maxlength="200"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="submit-btn"
            :loading="loading"
            round
            @click="handleRegister"
          >
            注 册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="auth-footer">
        <span>已有账号？</span>
        <router-link to="/login">返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { HomeFilled, Iphone, Lock, LocationInformation, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const shaking = ref(false)
let shakeTimer = null

// 触发卡片抖动动效（校验失败或注册失败时）
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
  role: 'resident', // resident：居民；staff：社区工作人员
  realName: '',
  phone: '',
  password: '',
  confirmPassword: '',
  address: ''
})

// 校验规则（与接口要求一致）
const phonePattern = /^1[3-9]\d{9}$/
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/

const rules = {
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 30, message: '姓名长度为 2~30 位', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: phonePattern, message: '请输入正确的 11 位手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { pattern: passwordPattern, message: '密码为 8~20 位，且须包含字母与数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入登录密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value && value !== form.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  address: [{ max: 200, message: '住址最长 200 位', trigger: 'blur' }]
}

async function handleRegister() {
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
    const phone = form.phone.trim()
    const payload = {
      role: form.role,
      username: phone, // 居民/工作人员：username 与 phone 一致
      realName: form.realName.trim(),
      phone,
      password: form.password
    }
    const address = form.address.trim()
    if (address) payload.address = address

    const res = await userStore.register(payload)

    if (form.role === 'staff') {
      // 工作人员注册后进入待审核状态
      await ElMessageBox.alert(
        res?.message || '注册成功，等待管理员审核',
        '注册成功',
        { confirmButtonText: '去登录', type: 'success' }
      )
    } else {
      ElMessage.success('注册成功，请登录')
    }
    router.replace('/login')
  } catch {
    // 注册失败：请求拦截器已弹出错误提示，这里补一个抖动反馈
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

  // 半透明蒙层：降低背景干扰，突出注册卡片
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
  max-width: 720px;
  background: var(--card-bg-color);
  border-radius: var(--radius-lg);
  padding: var(--space-xl) var(--space-lg);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

// 注册失败时的抖动动效
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
  margin-bottom: var(--space-md);

  :deep(.el-radio-button) {
    flex: 1;

    .el-radio-button__inner {
      width: 100%;
    }
  }
}

// 手机号字段下方的提示文字
.field-tip {
  margin: -8px 0 var(--space-md);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
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
