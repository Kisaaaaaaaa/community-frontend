<template>
  <div class="admin-users-page">
    <!-- 非管理员无权访问 -->
    <div v-if="!isAdmin" class="card-box">
      <el-result icon="warning" title="无访问权限" sub-title="仅管理员可查看用户管理列表">
        <template #extra>
          <el-button type="primary" @click="router.replace('/home')">返回首页</el-button>
        </template>
      </el-result>
    </div>

    <template v-else>
      <!-- 筛选区 -->
      <div class="card-box filter-card">
        <el-form :inline="true" @submit.prevent>
          <el-form-item label="关键词">
            <el-input
              v-model="query.keyword"
              placeholder="登录账号 / 姓名 / 手机号"
              clearable
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="query.role" placeholder="全部" clearable style="width: 150px">
              <el-option label="居民" value="resident" />
              <el-option label="社区工作人员" value="staff" />
              <el-option label="系统管理员" value="admin" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
              <el-option label="正常" :value="1" />
              <el-option label="待审核" :value="2" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 列表区 -->
      <div class="card-box table-card">
        <el-table v-loading="loading" :data="list" stripe>
          <el-table-column prop="userId" label="用户 ID" width="90" />
          <el-table-column prop="username" label="登录账号" min-width="130" />
          <el-table-column prop="realName" label="姓名" min-width="110" />
          <el-table-column prop="phone" label="手机号" min-width="140" />
          <el-table-column label="角色" width="130">
            <template #default="{ row }">
              <el-tag :type="roleTagType(row.role)" size="small">{{ roleLabel(row.role) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="注册时间" min-width="150" />
          <el-table-column label="操作" width="270" fixed="right">
            <template #default="{ row }">
              <div class="row-actions">
                <!-- 待审核：审核通过 / 审核拒绝 -->
                <template v-if="row.status === 2">
                  <el-button
                    link
                    type="success"
                    :loading="actingUser === row.userId"
                    @click="handleAudit(row, true)"
                  >
                    审核通过
                  </el-button>
                  <el-button link type="danger" @click="handleAudit(row, false)">审核拒绝</el-button>
                </template>
                <!-- 正常：禁用 -->
                <el-button
                  v-else-if="row.status === 1"
                  link
                  type="danger"
                  :disabled="isSelf(row)"
                  @click="handleStatus(row, 0)"
                >
                  禁用
                </el-button>
                <!-- 禁用：启用 -->
                <el-button v-else link type="success" @click="handleStatus(row, 1)">启用</el-button>

                <el-button
                  link
                  type="primary"
                  :disabled="isSelf(row)"
                  @click="openRoleDialog(row)"
                >
                  变更角色
                </el-button>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无用户数据" />
          </template>
        </el-table>

        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="query.page"
            v-model:page-size="query.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="fetchList"
            @size-change="handleSizeChange"
          />
        </div>
      </div>

      <!-- 角色变更弹窗 -->
      <el-dialog v-model="roleDialog.visible" title="变更用户角色" width="420px">
        <el-form label-width="80px">
          <el-form-item label="用户">
            <span>{{ roleDialog.user.realName }}（{{ roleDialog.user.username }}）</span>
          </el-form-item>
          <el-form-item label="当前角色">
            <span>{{ roleLabel(roleDialog.user.role) }}</span>
          </el-form-item>
          <el-form-item label="新角色">
            <el-select v-model="roleDialog.role" placeholder="请选择角色" style="width: 100%">
              <el-option label="居民" value="resident" />
              <el-option label="社区工作人员" value="staff" />
              <el-option label="系统管理员" value="admin" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="roleDialog.visible = false">取消</el-button>
          <el-button type="primary" :loading="roleDialog.loading" @click="handleRoleSubmit">
            确定
          </el-button>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminUserList, updateAdminUser } from '@/api/user'
import { useUserStore } from '@/store/user'
import { getRoleLabel } from '@/utils/auth'

const router = useRouter()
const userStore = useUserStore()

const isAdmin = computed(() => userStore.role === 'ADMIN')

const currentUserId = computed(() => userStore.userInfo?.userId)
// 是否为目标用户本人（后端禁止管理员禁用/修改自己的角色）
const isSelf = (row) => row.userId === currentUserId.value

const loading = ref(false)
const list = ref([])
const total = ref(0)
// 正在提交审核操作的用户 ID（用于行内按钮 loading）
const actingUser = ref(null)

// 角色变更弹窗状态
const roleDialog = reactive({
  visible: false,
  loading: false,
  user: {},
  role: ''
})

const query = reactive({
  keyword: '',
  role: '',
  status: '',
  page: 1,
  pageSize: 10
})

const STATUS_LABELS = { 0: '禁用', 1: '正常', 2: '待审核' }
const STATUS_TAG_TYPES = { 0: 'info', 1: 'success', 2: 'warning' }

const roleLabel = (role) => getRoleLabel(role)
const statusLabel = (status) => STATUS_LABELS[status] ?? '未知'
const statusTagType = (status) => STATUS_TAG_TYPES[status] || 'info'

const roleTagType = (role) => {
  const map = { resident: 'success', staff: 'warning', admin: 'danger' }
  return map[(role || '').toLowerCase()] || 'info'
}

// 拉取用户列表（空值参数不下发）
async function fetchList() {
  loading.value = true
  try {
    const params = {
      page: query.page,
      pageSize: query.pageSize
    }
    if (query.keyword.trim()) params.keyword = query.keyword.trim()
    if (query.role) params.role = query.role
    if (query.status !== '' && query.status !== null) params.status = query.status

    const data = await getAdminUserList(params)
    list.value = data?.list || []
    total.value = data?.total || 0
  } finally {
    loading.value = false
  }
}

// 条件变化后从第一页重新查询
function handleSearch() {
  query.page = 1
  fetchList()
}

function handleSizeChange() {
  query.page = 1
  fetchList()
}

function handleReset() {
  query.keyword = ''
  query.role = ''
  query.status = ''
  query.page = 1
  fetchList()
}

// 统一提交 4.1.8 变更（status / role）
async function applyUpdate(row, payload, successMsg) {
  await updateAdminUser(row.userId, payload)
  ElMessage.success(successMsg)
  fetchList()
}

// 启用 / 禁用
async function handleStatus(row, status) {
  const actionText = status === 1 ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(
      `确认${actionText}用户「${row.realName || row.username}」吗？`,
      `${actionText}确认`,
      { type: 'warning' }
    )
  } catch {
    return // 取消操作
  }
  await applyUpdate(row, { status }, `${actionText}成功`)
}

// 审核通过（status=1）/ 审核拒绝（status=0，即禁用）
async function handleAudit(row, approved) {
  const actionText = approved ? '审核通过' : '审核拒绝'
  try {
    await ElMessageBox.confirm(
      `确认${actionText}用户「${row.realName || row.username}」的注册申请吗？`,
      '审核确认',
      { type: 'warning' }
    )
  } catch {
    return // 取消操作
  }
  actingUser.value = row.userId
  try {
    await applyUpdate(row, { status: approved ? 1 : 0 }, `${actionText}成功`)
  } finally {
    actingUser.value = null
  }
}

// 打开角色变更弹窗
function openRoleDialog(row) {
  roleDialog.user = row
  roleDialog.role = row.role
  roleDialog.visible = true
}

// 提交角色变更
async function handleRoleSubmit() {
  if (!roleDialog.role || roleDialog.role === roleDialog.user.role) {
    ElMessage.info('请选择新的角色')
    return
  }
  roleDialog.loading = true
  try {
    await applyUpdate(roleDialog.user, { role: roleDialog.role }, '角色变更成功')
    roleDialog.visible = false
  } finally {
    roleDialog.loading = false
  }
}

onMounted(() => {
  if (isAdmin.value) fetchList()
})
</script>

<style lang="scss" scoped>
.filter-card {
  margin-bottom: var(--space-md);
}

.table-card {
  .pagination-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--space-md);
  }
}

// 操作列按钮强制单行：待审核行有 3 个按钮，避免换行导致行高不齐、错位
.row-actions {
  white-space: nowrap;
}

// 移动端：分页居中
@media (max-width: 768px) {
  .table-card .pagination-wrap {
    justify-content: center;
  }
}
</style>
