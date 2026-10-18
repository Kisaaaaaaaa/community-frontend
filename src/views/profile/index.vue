<template>
  <div class="profile-page">
    <el-skeleton v-if="loading" :rows="8" animated class="card-box" />

    <template v-else>
      <!-- 个人名片：横幅 + 居中头像 + 姓名 / 身份 -->
      <div class="card-box profile-hero">
        <div class="hero-banner"></div>
        <div class="hero-main">
          <el-avatar :size="88" class="profile-avatar">{{ avatarText }}</el-avatar>
          <h2 class="hero-name">{{ profile.realName || '-' }}</h2>
          <div class="hero-tags">
            <el-tag :type="roleTagType" effect="dark" round>{{ roleLabel }}</el-tag>
            <el-tag :type="statusTagType" effect="plain" round>{{ statusLabel }}</el-tag>
          </div>
          <div class="hero-actions">
            <el-button type="primary" round :icon="EditPen" @click="openEdit">编辑资料</el-button>
            <el-button round :icon="Lock" @click="openPwdDialog">修改密码</el-button>
          </div>
        </div>
      </div>

      <!-- 基本资料：对称两列 -->
      <div class="card-box profile-info">
        <h3 class="section-title">基本资料</h3>
        <ul class="info-list">
          <li v-for="item in infoItems" :key="item.label" :class="{ full: item.full }">
            <span class="info-label">{{ item.label }}</span>
            <span class="info-value">{{ item.value || '-' }}</span>
          </li>
        </ul>
      </div>

      <!-- 编辑抽屉：按需弹出，替代原页面内的常驻表单 -->
      <el-drawer
        v-model="drawerVisible"
        title="编辑资料"
        :size="drawerSize"
        :close-on-click-modal="false"
      >
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="profile-form"
        >
          <el-form-item v-if="isAdmin" label="工号" prop="username">
            <el-input v-model="form.username" placeholder="字母开头，3~20 位字母/数字/下划线" clearable />
          </el-form-item>

          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="form.realName" placeholder="请输入真实姓名" maxlength="30" clearable />
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" placeholder="不修改请留空" maxlength="11" clearable />
            <div class="field-tip">
              当前：{{ profile.phone || '-' }}；居民 / 工作人员修改手机号后，登录账号会同步变更
            </div>
          </el-form-item>

          <el-form-item label="家庭住址" prop="address">
            <el-input
              v-model="form.address"
              type="textarea"
              :rows="3"
              maxlength="200"
              show-word-limit
              placeholder="请输入家庭住址"
            />
          </el-form-item>

          <div class="drawer-actions">
            <el-button @click="closeDrawer">取消</el-button>
            <el-button type="primary" :loading="saving" @click="handleSave">保存修改</el-button>
          </div>
        </el-form>
      </el-drawer>

      <!-- 修改密码弹窗：成功后服务端会作废当前令牌，需重新登录 -->
      <el-dialog
        v-model="pwdVisible"
        title="修改密码"
        :width="dialogWidth"
        :close-on-click-modal="false"
        @closed="resetPwdForm"
      >
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          title="修改成功后当前登录将失效，需要重新登录"
          class="pwd-alert"
        />
        <el-form
          ref="pwdFormRef"
          :model="pwdForm"
          :rules="pwdRules"
          label-width="108px"
          class="pwd-form"
        >
          <el-form-item label="原密码" prop="oldPassword">
            <el-input
              v-model="pwdForm.oldPassword"
              type="password"
              show-password
              placeholder="请输入当前密码"
              maxlength="20"
            />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="pwdForm.newPassword"
              type="password"
              show-password
              placeholder="8~20 位，须包含字母与数字"
              maxlength="20"
            />
          </el-form-item>
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input
              v-model="pwdForm.confirmPassword"
              type="password"
              show-password
              placeholder="请再次输入新密码"
              maxlength="20"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="pwdVisible = false">取消</el-button>
          <el-button type="primary" :loading="pwdSaving" @click="handleChangePassword">
            确认修改
          </el-button>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { EditPen, Lock } from '@element-plus/icons-vue'
import { changePassword, getProfile, updateProfile } from '@/api/user'
import { useUserStore } from '@/store/user'
import { getRoleLabel } from '@/utils/auth'

const userStore = useUserStore()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const drawerVisible = ref(false)
const drawerSize = ref('420px')
const dialogWidth = ref('480px')
const formRef = ref()

// 修改密码弹窗
const pwdVisible = ref(false)
const pwdSaving = ref(false)
const pwdFormRef = ref()

// 接口返回的当前用户信息（只读展示）
const profile = reactive({
  userId: '',
  username: '',
  realName: '',
  phone: '',
  role: '',
  status: '',
  address: '',
  registerTime: ''
})

// 可编辑表单：手机号接口只返回脱敏值，故不回填，留空表示不修改
const form = reactive({
  username: '',
  realName: '',
  phone: '',
  address: ''
})

// 修改密码表单
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const PHONE_PATTERN = /^1[3-9]\d{9}$/
const STAFF_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_]{2,19}$/

const isAdmin = computed(() => userStore.role === 'ADMIN')
const roleLabel = computed(() => getRoleLabel(profile.role || userStore.role))
const avatarText = computed(() => (profile.realName || roleLabel.value || '用户').charAt(0))

const roleTagType = computed(() => {
  const map = { ADMIN: 'danger', STAFF: 'warning', RESIDENT: 'success' }
  return map[userStore.role] || 'info'
})

const STATUS_LABELS = { 0: '禁用', 1: '正常', 2: '待审核' }
const statusLabel = computed(() => STATUS_LABELS[profile.status] ?? '未知')

const statusTagType = computed(() => {
  const map = { 0: 'info', 1: 'success', 2: 'warning' }
  return map[profile.status] || 'info'
})

// 对称两列的展示项
const infoItems = computed(() => [
  { label: '用户 ID', value: profile.userId },
  { label: '登录账号', value: profile.username },
  { label: '手机号', value: profile.phone },
  { label: '角色身份', value: roleLabel.value },
  { label: '账号状态', value: statusLabel.value },
  { label: '注册时间', value: profile.registerTime },
  { label: '家庭住址', value: profile.address, full: true }
])

const rules = {
  username: [
    {
      validator: (rule, value, callback) => {
        if (value && !STAFF_ID_PATTERN.test(value)) {
          callback(new Error('工号须为字母开头、3~20 位字母/数字/下划线'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 30, message: '姓名长度需为 2~30 位', trigger: 'blur' }
  ],
  phone: [
    {
      validator: (rule, value, callback) => {
        if (value && !PHONE_PATTERN.test(value)) {
          callback(new Error('请输入正确的 11 位手机号'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 新密码规则与注册保持一致：8~20 位且包含字母与数字
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { pattern: passwordPattern, message: '新密码为 8~20 位，且须包含字母与数字', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value && value === pwdForm.oldPassword) {
          callback(new Error('新密码不能与原密码相同'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入的新密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 抽屉 / 弹窗宽度随屏幕自适应，窄屏占满
function syncResponsiveSizes() {
  const narrow = window.innerWidth <= 768
  drawerSize.value = narrow ? '86%' : '420px'
  dialogWidth.value = narrow ? '92%' : '480px'
}

async function loadProfile() {
  loading.value = true
  try {
    const data = await getProfile()
    Object.assign(profile, data || {})
    resetForm()
  } finally {
    loading.value = false
  }
}

// 把表单恢复为最近一次保存的内容（手机号留空）
function resetForm() {
  form.username = profile.username || ''
  form.realName = profile.realName || ''
  form.phone = ''
  form.address = profile.address || ''
  formRef.value?.clearValidate()
}

function openEdit() {
  resetForm()
  drawerVisible.value = true
}

function closeDrawer() {
  drawerVisible.value = false
  resetForm()
}

// 仅提交发生变化的字段（接口要求至少一项）
function buildPayload() {
  const payload = {}
  const realName = form.realName.trim()
  const phone = form.phone.trim()
  const address = form.address.trim()

  if (isAdmin.value && form.username.trim() && form.username.trim() !== profile.username) {
    payload.username = form.username.trim()
  }
  if (realName && realName !== profile.realName) {
    payload.realName = realName
  }
  if (phone && phone !== profile.phone) {
    payload.phone = phone
  }
  if (address !== (profile.address || '')) {
    payload.address = address
  }
  return payload
}

async function handleSave() {
  await formRef.value.validate()
  const payload = buildPayload()

  if (Object.keys(payload).length === 0) {
    ElMessage.info('当前没有需要保存的修改')
    return
  }

  saving.value = true
  try {
    await updateProfile(payload)
    ElMessage.success('个人信息已更新')
    // 真实姓名变化时同步顶栏显示
    if (payload.realName) {
      userStore.updateUserInfo({ realName: payload.realName })
    }
    closeDrawer()
    await loadProfile()
  } finally {
    saving.value = false
  }
}

// ---------- 修改密码 ----------
function openPwdDialog() {
  resetPwdForm()
  pwdVisible.value = true
}

function resetPwdForm() {
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  pwdFormRef.value?.clearValidate()
}

async function handleChangePassword() {
  await pwdFormRef.value.validate()
  pwdSaving.value = true
  try {
    await changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    pwdVisible.value = false
    ElMessage.success('密码修改成功，请重新登录')
    // 服务端已作废当前令牌，清理本地登录状态并回到登录页
    userStore.resetAuth()
    router.replace('/login')
  } finally {
    pwdSaving.value = false
  }
}

onMounted(() => {
  syncResponsiveSizes()
  window.addEventListener('resize', syncResponsiveSizes)
  loadProfile()
})

onUnmounted(() => window.removeEventListener('resize', syncResponsiveSizes))
</script>

<style lang="scss" scoped>
.profile-page {
  max-width: 920px;
  margin: 0 auto;
}

/* ---------- 个人名片 ---------- */
.profile-hero {
  padding: 0;
  overflow: hidden;
  text-align: center;
  margin-bottom: var(--space-md);
}

.hero-banner {
  height: 132px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #8ec5ff 100%);
}

.hero-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 var(--space-lg) var(--space-lg);
}

.profile-avatar {
  margin-top: -44px;
  background: var(--color-primary);
  color: #fff;
  font-size: 34px;
  border: 4px solid var(--card-bg-color, #fff);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.hero-name {
  margin: var(--space-xs) 0 0;
  font-size: var(--font-size-xl);
  font-weight: 600;
  letter-spacing: 1px;
}

.hero-tags {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

/* ---------- 基本资料 ---------- */
.section-title {
  margin: 0 0 var(--space-lg);
  font-size: var(--font-size-lg);
  font-weight: 600;
  padding-left: var(--space-sm);
  border-left: 4px solid var(--color-primary);
  line-height: 1.2;
}

.info-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-sm) var(--space-md);
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 12px 16px;
    background: var(--bg-color-page, #f7f8fa);
    border-radius: var(--radius-md, 8px);
    transition: background 0.2s ease;

    &:hover {
      background: var(--color-primary-light-9, #ecf5ff);
    }

    &.full {
      grid-column: 1 / -1;
    }
  }

  .info-label {
    flex: none;
    min-width: 72px;
    color: var(--text-color-secondary);
    font-size: var(--font-size-sm);
  }

  .info-value {
    flex: 1;
    font-weight: 500;
    word-break: break-all;
  }
}

/* ---------- 修改密码弹窗 ---------- */
.pwd-alert {
  margin-bottom: var(--space-md);
}

/* ---------- 编辑抽屉 ---------- */
.profile-form {
  .field-tip {
    margin-top: 4px;
    font-size: var(--font-size-xs);
    color: var(--text-color-secondary);
    line-height: 1.5;
  }
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-lighter, #ebeef5);
}

/* ---------- 响应式 ---------- */
@media (max-width: 768px) {
  .hero-banner {
    height: 104px;
  }

  .info-list {
    grid-template-columns: 1fr;
  }
}
</style>
