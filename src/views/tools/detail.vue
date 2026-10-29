<template>
  <div v-loading="loading" class="tool-detail-page">
    <!-- 左上角返回 + 工作人员操作 -->
    <div class="top-bar">
      <el-button link type="primary" class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <div v-if="isStaffOrAdmin && tool" class="top-actions">
        <el-button type="primary" plain class="btn-accessible" @click="openStatusDialog">
          变更状态
        </el-button>
      </div>
    </div>

    <template v-if="tool">
      <!-- 工具概览 -->
      <div class="card-box overview-card">
        <div class="overview-media">
          <el-image
            v-if="tool.imageUrls && tool.imageUrls.length"
            :src="tool.imageUrls[0]"
            fit="cover"
            class="main-image"
            :preview-src-list="tool.imageUrls"
            preview-teleported
          >
            <template #error>
              <div class="image-placeholder">
                <el-icon :size="36"><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div v-else class="main-image image-placeholder">
            <el-icon :size="36"><Picture /></el-icon>
          </div>
          <div v-if="tool.imageUrls && tool.imageUrls.length > 1" class="thumb-list">
            <el-image
              v-for="(url, index) in tool.imageUrls"
              :key="url"
              :src="url"
              fit="cover"
              class="thumb"
              :preview-src-list="tool.imageUrls"
              :initial-index="index"
              preview-teleported
            />
          </div>
        </div>

        <div class="overview-info">
          <div class="title-row">
            <div class="tool-title">{{ tool.toolName }}</div>
            <div class="tag-row">
              <el-tag :type="statusTagType(tool.status)" effect="light">
                {{ statusLabel(tool.status) }}
              </el-tag>
              <el-tag :type="auditTagType(tool.auditStatus)" effect="plain">
                {{ auditLabel(tool.auditStatus) }}
              </el-tag>
            </div>
          </div>
          <div class="tool-code">{{ tool.toolCode }}</div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">型号规格</span>
              <span class="meta-value">{{ tool.modelSpec || '-' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">工具类别</span>
              <span class="meta-value">{{ categoryLabel(tool.category) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">押金金额</span>
              <span class="meta-value is-price">¥{{ formatAmount(tool.depositAmount) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">损坏程度</span>
              <span class="meta-value">{{ damageLabel(tool.damageLevel) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">存放区域</span>
              <span class="meta-value">{{ tool.storageLocation || '-' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">租赁次数</span>
              <span class="meta-value">{{ tool.rentCount ?? 0 }} 次</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">最近维修时间</span>
              <span class="meta-value">{{ tool.lastRepairTime || '暂无维修记录' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="card-box">
        <h4 class="section-title">
          <span class="section-title__icon"><el-icon><Document /></el-icon></span>
          使用说明
        </h4>
        <div class="usage-text">{{ tool.usageInstructions?.text || '暂无使用说明' }}</div>
        <div v-if="tool.usageInstructions?.imageUrls?.length" class="usage-images">
          <el-image
            v-for="(url, index) in tool.usageInstructions.imageUrls"
            :key="url"
            :src="url"
            fit="cover"
            class="usage-image"
            :preview-src-list="tool.usageInstructions.imageUrls"
            :initial-index="index"
            preview-teleported
          />
        </div>
      </div>

      <!-- 历史租赁记录 -->
      <div class="card-box">
        <h4 class="section-title">
          <span class="section-title__icon"><el-icon><Clock /></el-icon></span>
          历史租赁记录
        </h4>
        <el-table v-if="rentalHistory.length" :data="rentalHistory" size="small" stripe>
          <el-table-column prop="orderNo" label="预约单号" min-width="170" />
          <el-table-column prop="renterName" label="租赁人" min-width="90" />
          <el-table-column prop="startTime" label="开始时间" min-width="140" />
          <el-table-column prop="endTime" label="结束时间" min-width="140" />
          <el-table-column label="验收结果" min-width="110">
            <template #default="{ row }">
              <el-tag
                v-if="row.acceptanceResult"
                :type="acceptanceResultTag(row.acceptanceResult)"
                size="small"
              >
                {{ acceptanceResultLabel(row.acceptanceResult) }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无租赁记录" :image-size="80" />
      </div>

      <!-- 状态变更记录（工作人员 / 管理员） -->
      <div v-if="isStaffOrAdmin" class="card-box">
        <div class="section-head">
          <h4 class="section-title">
            <span class="section-title__icon"><el-icon><Refresh /></el-icon></span>
            状态变更记录
          </h4>
          <el-button link type="primary" @click="loadLogs">刷新</el-button>
        </div>
        <el-table v-loading="logsLoading" :data="logs.list" size="small" stripe>
          <el-table-column label="变更时间" min-width="140">
            <template #default="{ row }">{{ row.operateTime || '-' }}</template>
          </el-table-column>
          <el-table-column label="状态变更" min-width="170">
            <template #default="{ row }">
              <span>{{ statusLabel(row.fromStatus) }}</span>
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              <span>{{ statusLabel(row.toStatus) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="重估损坏程度" min-width="110">
            <template #default="{ row }">
              {{ row.damageLevel ? damageLabel(row.damageLevel) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="变更原因" min-width="200" show-overflow-tooltip />
          <el-table-column prop="operator" label="操作人" min-width="100">
            <template #default="{ row }">{{ row.operator || '-' }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!logsLoading && !logs.list.length" description="暂无状态变更记录" :image-size="80" />
        <div v-if="logs.total > 0" class="pagination-bar">
          <el-pagination
            v-model:current-page="logs.page"
            v-model:page-size="logs.pageSize"
            :total="logs.total"
            :page-sizes="[10, 20, 30, 50]"
            layout="total, sizes, prev, pager, next"
            background
            @size-change="handleLogSizeChange"
            @current-change="loadLogs"
          />
        </div>
      </div>
    </template>

    <el-empty v-else-if="!loading" description="工具不存在或已下架">
      <el-button type="primary" @click="goBack">返回</el-button>
    </el-empty>

    <!-- 工具状态更新弹窗（4.2.5，STAFF / ADMIN） -->
    <el-dialog v-model="statusVisible" title="变更工具状态" width="520px" destroy-on-close>
      <el-alert
        v-if="tool"
        :type="tool.status === 'RENTED' ? 'warning' : 'info'"
        :closable="false"
        show-icon
        :title="tool.status === 'RENTED'
          ? '工具处于租赁中，归还验收前不可手动变更状态'
          : `当前状态：${statusLabel(tool.status)}`"
        class="mb-md"
      />
      <el-form
        ref="statusFormRef"
        :model="statusForm"
        :rules="statusRules"
        label-width="100px"
        @submit.prevent
      >
        <el-form-item label="目标状态" prop="status">
          <el-select
            v-model="statusForm.status"
            placeholder="请选择目标状态"
            class="form-input"
            :disabled="tool?.status === 'RENTED'"
          >
            <el-option
              v-for="item in targetStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="变更原因" prop="reason">
          <el-input
            v-model="statusForm.reason"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="如：维修失败，电机烧毁无法修复"
            :disabled="tool?.status === 'RENTED'"
          />
        </el-form-item>
        <el-form-item label="损坏程度">
          <el-select
            v-model="statusForm.damageLevel"
            placeholder="可选，同步重估损坏程度"
            clearable
            class="form-input"
            :disabled="tool?.status === 'RENTED'"
          >
            <el-option
              v-for="item in DAMAGE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="tool?.status === 'RENTED'"
          @click="handleStatusSubmit"
        >
          提交变更
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Clock, Document, Picture, Refresh } from '@element-plus/icons-vue'
import { getToolDetail, getToolStatusLogs, updateToolStatus } from '@/api/tool'
import { useUserStore } from '@/store/user'
import {
  acceptanceResultLabel,
  acceptanceResultTag,
  formatAmount
} from '@/utils/rentrecord'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isStaffOrAdmin = computed(() => ['STAFF', 'ADMIN'].includes(userStore.role))

const toolCode = computed(() => String(route.params.toolCode || ''))

const loading = ref(false)
const tool = ref(null)
const rentalHistory = ref([])

// ---------- 本地映射（不调用字典接口） ----------
const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: '可用' },
  { value: 'RESERVED', label: '已预约' },
  { value: 'RENTED', label: '租赁中' },
  { value: 'REPAIRING', label: '维修中' },
  { value: 'SCRAPPED', label: '报废' }
]
const STATUS_TAG_TYPES = {
  AVAILABLE: 'success',
  RESERVED: 'warning',
  RENTED: 'primary',
  REPAIRING: 'danger',
  SCRAPPED: 'info'
}
const CATEGORY_OPTIONS = [
  { value: 'WX', label: '维修工具' },
  { value: 'YY', label: '园艺工具' },
  { value: 'QJ', label: '清洁工具' },
  { value: 'QT', label: '其他' }
]
const AUDIT_OPTIONS = [
  { value: 'PENDING', label: '待审核' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '需修改' }
]
const AUDIT_TAG_TYPES = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger'
}
const DAMAGE_OPTIONS = [
  { value: 1, label: '1 级（全新）' },
  { value: 2, label: '2 级（轻微磨损）' },
  { value: 3, label: '3 级（中度磨损）' },
  { value: 4, label: '4 级（严重损坏）' }
]
// 手动变更允许的目标状态（4.2.5）
const targetStatusOptions = [
  { value: 'AVAILABLE', label: '可用（重新上架）' },
  { value: 'REPAIRING', label: '维修中' },
  { value: 'SCRAPPED', label: '报废' }
]

const statusLabel = (value) =>
  STATUS_OPTIONS.find((item) => item.value === value)?.label || value || '-'
const statusTagType = (value) => STATUS_TAG_TYPES[value] || 'info'
const categoryLabel = (value) =>
  CATEGORY_OPTIONS.find((item) => item.value === value)?.label || value || '-'
const auditLabel = (value) =>
  AUDIT_OPTIONS.find((item) => item.value === value)?.label || value || '-'
const auditTagType = (value) => AUDIT_TAG_TYPES[value] || 'info'
const damageLabel = (value) =>
  DAMAGE_OPTIONS.find((item) => item.value === Number(value))?.label || '-'

// ---------- 详情加载 ----------
async function loadDetail() {
  if (!toolCode.value) return
  loading.value = true
  try {
    const data = await getToolDetail(toolCode.value)
    tool.value = data?.tool || null
    rentalHistory.value = data?.rentalHistory || []
    if (tool.value && isStaffOrAdmin.value) {
      loadLogs()
    }
  } finally {
    loading.value = false
  }
}

// ---------- 状态变更日志（4.2.6） ----------
const logsLoading = ref(false)
const logs = reactive({ list: [], total: 0, page: 1, pageSize: 10 })

async function loadLogs() {
  if (!toolCode.value) return
  logsLoading.value = true
  try {
    const data = await getToolStatusLogs(toolCode.value, {
      page: logs.page,
      pageSize: logs.pageSize
    })
    logs.list = data?.list || []
    logs.total = data?.total || 0
  } finally {
    logsLoading.value = false
  }
}

function handleLogSizeChange() {
  logs.page = 1
  loadLogs()
}

// ---------- 状态更新弹窗（4.2.5） ----------
const statusVisible = ref(false)
const submitting = ref(false)
const statusFormRef = ref()
const statusForm = reactive({ status: '', reason: '', damageLevel: null })

const statusRules = {
  status: [{ required: true, message: '请选择目标状态', trigger: 'change' }],
  reason: [{ required: true, message: '请填写变更原因', trigger: 'blur' }]
}

function openStatusDialog() {
  statusForm.status = ''
  statusForm.reason = ''
  statusForm.damageLevel = null
  statusVisible.value = true
}

async function handleStatusSubmit() {
  try {
    await statusFormRef.value.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    await updateToolStatus(toolCode.value, {
      status: statusForm.status,
      reason: statusForm.reason.trim(),
      damageLevel: statusForm.damageLevel ?? undefined
    })
    statusVisible.value = false
    ElMessage.success('工具状态已更新')
    logs.page = 1
    await loadDetail()
  } catch {
    // 失败原因已由请求拦截器统一提示
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(loadDetail)
</script>

<style lang="scss" scoped>
.tool-detail-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);

  .back-btn {
    padding: 0;
    font-size: var(--font-size-base);
  }
}

/* ---------- 概览 ---------- */
.overview-card {
  display: flex;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.overview-media {
  flex: 0 0 280px;
  max-width: 100%;
}

.main-image {
  width: 100%;
  height: 210px;
  border-radius: var(--radius-md);
  overflow: hidden;
  display: block;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--fill-color-light, #f5f7fa);
  color: var(--text-placeholder, #a8abb2);
}

.thumb-list {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
  flex-wrap: wrap;

  .thumb {
    width: 62px;
    height: 62px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }
}

.overview-info {
  flex: 1 1 320px;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.tool-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.tag-row {
  display: flex;
  gap: var(--space-sm);
}

.tool-code {
  margin-top: var(--space-xs);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  letter-spacing: 0.4px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0 var(--space-lg);
  margin-top: var(--space-md);
}

.meta-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  border-bottom: 1px dashed var(--border-lighter);
}

.meta-label {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.meta-value {
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  text-align: right;
  word-break: break-all;

  &.is-price {
    font-size: var(--font-size-base);
    font-weight: 700;
    color: var(--color-warning, #e6a23c);
  }
}

/* ---------- 区块 ---------- */
.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: 0 0 var(--space-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.section-title__icon {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  background: rgba(64, 158, 255, 0.12);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);

  .section-title {
    margin-bottom: var(--space-md);
  }
}

.usage-text {
  white-space: pre-wrap;
  line-height: 1.8;
  color: var(--text-regular);
  font-size: var(--font-size-sm);
}

.usage-images {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  flex-wrap: wrap;

  .usage-image {
    width: 120px;
    height: 120px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }
}

.arrow-icon {
  margin: 0 6px;
  color: var(--text-secondary);
  vertical-align: middle;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-md);
}

.form-input {
  width: 260px;
}

@media (max-width: 768px) {
  .overview-card {
    flex-direction: column;
  }

  .overview-media {
    flex: none;
    width: 100%;
  }

  .main-image {
    height: 180px;
  }

  .tool-title {
    font-size: 20px;
  }
}
</style>
