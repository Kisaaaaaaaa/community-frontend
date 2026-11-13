<template>
  <div class="record-manage-page">
    <!-- 筛选区 -->
    <div class="card-box filter-card">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="租赁人">
          <el-input
            v-model="query.renterName"
            placeholder="姓名模糊搜索"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="工具编号">
          <el-input
            v-model="query.toolCode"
            placeholder="如 SQ-G-WX-0001"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="存放区域">
          <el-input
            v-model="query.storageLocation"
            placeholder="如 A区"
            clearable
            style="width: 130px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="租赁次数">
          <el-input-number
            v-model="query.rentCountMin"
            :min="0"
            :precision="0"
            :value-on-clear="null"
            controls-position="right"
            placeholder="≥ 次"
            style="width: 120px"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item label="最近维修">
          <el-date-picker
            v-model="repairRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 230px"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item label="验收结果">
          <el-select
            v-model="query.acceptanceResult"
            placeholder="全部"
            clearable
            style="width: 140px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in ACCEPTANCE_RESULT_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="逾期状态">
          <el-select
            v-model="query.overdueStatus"
            placeholder="全部"
            clearable
            style="width: 130px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in OVERDUE_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="租赁时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button :loading="exporting" @click="handleExport">
            <el-icon><Download /></el-icon>
            <span>导出 Excel</span>
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 列表 -->
    <div class="card-box table-card">
      <el-table v-loading="loading" :data="list" stripe size="small" class="record-table">
        <el-table-column label="预约单号" min-width="148">
          <template #default="{ row }">
            <span class="order-no" :title="row.orderNo">{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column label="工具" min-width="120">
          <template #default="{ row }">
            <span class="tool-name ellipsis" :title="row.toolName">{{ row.toolName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="租赁人" min-width="84">
          <template #default="{ row }">
            <span>{{ row.renterName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="取件人" min-width="84">
          <template #default="{ row }">
            <span>{{ row.pickerName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="租赁时段" min-width="176">
          <template #default="{ row }">
            <div class="slot-cell">
              <span>{{ shortDT(row.startTime) }}</span>
              <span class="slot-sep">→</span>
              <span>{{ shortDT(row.endTime) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="押金" min-width="90">
          <template #default="{ row }">
            <span class="deposit">¥{{ formatAmount(row.depositAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="退还" min-width="90">
          <template #default="{ row }">
            <span v-if="row.refundAmount !== undefined || row.refundStatus" class="refund">
              ¥{{ formatAmount(row.refundAmount) }}
            </span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="验收结果" min-width="100">
          <template #default="{ row }">
            <el-tag
              v-if="row.acceptanceResult"
              :type="acceptanceResultTag(row.acceptanceResult)"
              size="small"
            >
              {{ acceptanceResultLabel(row.acceptanceResult) }}
            </el-tag>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="逾期费用" min-width="100">
          <template #default="{ row }">
            <span v-if="row.overdueFee && Number(row.overdueFee) > 0" class="overdue-fee">
              ¥{{ formatAmount(row.overdueFee) }}
            </span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="86">
          <template #default="{ row }">
            <el-tag :type="recordStatusTag(row.status)" size="small">
              {{ recordStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row)">详情</el-button>
            <el-button
              v-if="canPickup(row.status)"
              link
              type="success"
              @click="openPickupDialog(row)"
            >
              取件确认
            </el-button>
            <el-button
              v-if="canReturn(row.status)"
              link
              type="warning"
              @click="openReturnDialog(row)"
            >
              归还验收
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无租赁记录" />
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

    <!-- 取件确认弹窗 -->
    <PickupDialog v-model:visible="pickup.visible" :row="pickup.row" @success="fetchList" />

    <!-- 归还验收弹窗 -->
    <ReturnDialog v-model:visible="returnDlg.visible" :row="returnDlg.row" @success="fetchList" />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { exportRecords, getManageRecords } from '@/api/rentrecord'
import { getToolDetail, getToolList } from '@/api/tool'
import PickupDialog from '@/components/rentrecord/PickupDialog.vue'
import ReturnDialog from '@/components/rentrecord/ReturnDialog.vue'
import {
  ACCEPTANCE_RESULT_OPTIONS,
  OVERDUE_STATUS_OPTIONS,
  acceptanceResultLabel,
  acceptanceResultTag,
  canPickup,
  canReturn,
  formatAmount,
  recordStatusLabel,
  recordStatusTag,
  shortDT
} from '@/utils/rentrecord'

const router = useRouter()

const loading = ref(false)
const exporting = ref(false)
const list = ref([])
const total = ref(0)
const dateRange = ref([])
const repairRange = ref([])

const query = reactive({
  renterName: '',
  toolCode: '',
  storageLocation: '',
  rentCountMin: null,
  acceptanceResult: '',
  overdueStatus: '',
  page: 1,
  pageSize: 10
})

// 工具维度筛选（后端租赁记录接口不支持，先取工具明细在前端关联过滤）
const rentCountFiltered = () =>
  query.rentCountMin !== null && query.rentCountMin !== undefined && query.rentCountMin !== ''

const advancedActive = computed(
  () =>
    Boolean(query.storageLocation.trim()) ||
    rentCountFiltered() ||
    repairRange.value?.length === 2
)

// 工具编码 → { storageLocation, rentCount, lastRepairTime }
const toolMetaMap = ref(new Map())
let toolMetaLoading = null

async function loadAllToolMeta() {
  if (toolMetaMap.value.size) return toolMetaMap.value
  if (!toolMetaLoading) {
    toolMetaLoading = (async () => {
      const codes = []
      let page = 1
      let pages = 1
      do {
        const data = await getToolList({ page, pageSize: 50 })
        ;(data?.list || []).forEach((it) => codes.push(it.toolCode))
        pages = data?.pages || 1
        page += 1
      } while (page <= pages)

      const map = new Map()
      let cursor = 0
      // 控制并发，避免工具较多时瞬间打出过多请求
      async function worker() {
        while (cursor < codes.length) {
          const code = codes[cursor]
          cursor += 1
          try {
            const detail = await getToolDetail(code)
            const tool = detail?.tool || {}
            map.set(code, {
              storageLocation: tool.storageLocation || '',
              rentCount: Number(tool.rentCount || 0),
              lastRepairTime: tool.lastRepairTime || ''
            })
          } catch {
            map.set(code, { storageLocation: '', rentCount: 0, lastRepairTime: '' })
          }
        }
      }
      await Promise.all(
        Array.from({ length: Math.min(5, codes.length) }, () => worker())
      )
      toolMetaMap.value = map
      return map
    })().finally(() => {
      toolMetaLoading = null
    })
  }
  return toolMetaLoading
}

function matchToolMeta(meta) {
  if (!meta) return false
  const area = query.storageLocation.trim().toLowerCase()
  if (area && !String(meta.storageLocation).toLowerCase().includes(area)) return false
  if (rentCountFiltered() && meta.rentCount < Number(query.rentCountMin)) return false
  if (repairRange.value?.length === 2) {
    if (!meta.lastRepairTime) return false
    const day = String(meta.lastRepairTime).slice(0, 10).replace(/\//g, '-')
    if (day < repairRange.value[0] || day > repairRange.value[1]) return false
  }
  return true
}

function buildBaseParams() {
  const params = {}
  if (query.renterName.trim()) params.renterName = query.renterName.trim()
  if (query.toolCode.trim()) params.toolCode = query.toolCode.trim()
  if (query.acceptanceResult) params.acceptanceResult = query.acceptanceResult
  if (query.overdueStatus) params.overdueStatus = query.overdueStatus
  if (dateRange.value?.length === 2) {
    params.dateStart = dateRange.value[0]
    params.dateEnd = dateRange.value[1]
  }
  return params
}

// 工具维度筛选生效时，先把符合基础条件的记录全部取回再本地过滤分页
async function fetchAllRecords(baseParams) {
  const PAGE_SIZE = 50
  const MAX_PAGES = 40
  const first = await getManageRecords({ ...baseParams, page: 1, pageSize: PAGE_SIZE })
  let rows = first?.list || []
  const pages = Math.min(first?.pages || 1, MAX_PAGES)
  if (pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) =>
        getManageRecords({ ...baseParams, page: i + 2, pageSize: PAGE_SIZE })
      )
    )
    rest.forEach((data) => {
      rows = rows.concat(data?.list || [])
    })
  }
  return rows
}

// 4.4.5 租赁记录管理查询
async function fetchList() {
  loading.value = true
  try {
    const baseParams = buildBaseParams()
    if (advancedActive.value) {
      const metaMap = await loadAllToolMeta()
      const matched = new Set()
      metaMap.forEach((meta, code) => {
        if (matchToolMeta(meta)) matched.add(code)
      })
      const rows = matched.size ? await fetchAllRecords(baseParams) : []
      const filtered = rows.filter((row) => matched.has(row.toolCode))
      total.value = filtered.length
      const start = (query.page - 1) * query.pageSize
      list.value = filtered.slice(start, start + query.pageSize)
      return
    }
    const data = await getManageRecords({
      ...baseParams,
      page: query.page,
      pageSize: query.pageSize
    })
    list.value = data?.list || []
    total.value = data?.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function handleSizeChange() {
  query.page = 1
  fetchList()
}

function handleReset() {
  query.renterName = ''
  query.toolCode = ''
  query.storageLocation = ''
  query.rentCountMin = null
  query.acceptanceResult = ''
  query.overdueStatus = ''
  dateRange.value = []
  repairRange.value = []
  query.page = 1
  fetchList()
}

function goDetail(row) {
  router.push(`/records/${row.orderNo}`)
}

// 4.4.7 导出 Excel
async function handleExport() {
  if (advancedActive.value) {
    ElMessage.warning('导出暂不支持「存放区域 / 租赁次数 / 最近维修」条件，将按其余筛选条件导出')
  }
  exporting.value = true
  try {
    const blob = await exportRecords(buildBaseParams())
    // 构造文件名：租赁记录-yyyyMMdd.xlsx
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const fileName = `租赁记录-${y}${m}${d}.xlsx`
    // 触发下载
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    // 错误由拦截器统一提示
  } finally {
    exporting.value = false
  }
}

// 取件确认弹窗
const pickup = reactive({ visible: false, row: null })
function openPickupDialog(row) {
  pickup.row = row
  pickup.visible = true
}

// 归还验收弹窗
const returnDlg = reactive({ visible: false, row: null })
function openReturnDialog(row) {
  returnDlg.row = row
  returnDlg.visible = true
}

onMounted(fetchList)
</script>

<style lang="scss" scoped>
.filter-card {
  margin-bottom: var(--space-md);
}

.table-card {
  .record-table {
    :deep(.el-table__cell) {
      padding: 7px 0;
    }

    :deep(.cell) {
      padding: 0 6px;
      font-size: var(--font-size-sm);
    }
  }

  .order-no {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--font-size-xs);
    color: var(--text-regular);
    letter-spacing: 0.3px;
    font-variant-numeric: tabular-nums;
  }

  .tool-name {
    font-weight: 500;
    color: var(--text-primary);
  }

  .ellipsis {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: middle;
  }

  .slot-cell {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    font-size: var(--font-size-xs);
    font-variant-numeric: tabular-nums;

    .slot-sep {
      color: var(--text-secondary);
    }
  }

  .deposit {
    font-weight: 600;
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    font-variant-numeric: tabular-nums;
  }

  .refund {
    font-size: var(--font-size-sm);
    color: var(--color-success);
    font-variant-numeric: tabular-nums;
  }

  .overdue-fee {
    font-size: var(--font-size-sm);
    color: var(--color-danger);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .text-muted {
    color: var(--text-placeholder);
  }

  .pagination-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--space-md);
  }
}

@media (max-width: 768px) {
  .table-card .pagination-wrap {
    justify-content: center;
  }
}
</style>
