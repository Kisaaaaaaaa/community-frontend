<template>
  <div class="reservation-manage-page">
    <!-- 筛选区 -->
    <div class="card-box filter-card">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="租赁人姓名 / 预约单号"
            clearable
            style="width: 210px"
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
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px" @change="handleSearch">
            <el-option
              v-for="item in RESERVATION_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="租赁开始">
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
        </el-form-item>
      </el-form>
    </div>

    <!-- 列表 -->
    <div class="card-box table-card">
      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column prop="orderNo" label="预约单号" min-width="180" />
        <el-table-column prop="toolName" label="工具" min-width="140" />
        <el-table-column prop="renterName" label="租赁人" min-width="110" />
        <el-table-column label="租赁时段" min-width="230">
          <template #default="{ row }">
            <div class="slot-cell">
              <span>{{ row.startTime }}</span>
              <span class="slot-sep">~</span>
              <span>{{ row.endTime }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="押金" width="140">
          <template #default="{ row }">
            <span class="deposit">¥{{ formatAmount(row.depositAmount) }}</span>
            <el-tag size="small" type="info" effect="plain">{{ depositStatusLabel(row.depositStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="reservationStatusTag(row.status)" size="small">
              {{ reservationStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row)">详情</el-button>
            <el-button
              v-if="canCancel(row.status)"
              link
              type="danger"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无预约数据" />
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
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { cancelReservation, getManageReservations } from '@/api/reservation'
import {
  RESERVATION_STATUS_OPTIONS,
  canCancel,
  depositStatusLabel,
  formatAmount,
  reservationStatusLabel,
  reservationStatusTag
} from '@/utils/reservation'

const router = useRouter()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const dateRange = ref([])

const query = reactive({
  keyword: '',
  toolCode: '',
  status: '',
  page: 1,
  pageSize: 10
})

// 4.3.8 预约管理列表
async function fetchList() {
  loading.value = true
  try {
    const params = { page: query.page, pageSize: query.pageSize }
    if (query.keyword.trim()) params.keyword = query.keyword.trim()
    if (query.toolCode.trim()) params.toolCode = query.toolCode.trim()
    if (query.status) params.status = query.status
    if (dateRange.value?.length === 2) {
      params.dateStart = dateRange.value[0]
      params.dateEnd = dateRange.value[1]
    }
    const data = await getManageReservations(params)
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
  query.keyword = ''
  query.toolCode = ''
  query.status = ''
  dateRange.value = []
  query.page = 1
  fetchList()
}

function goDetail(row) {
  router.push(`/reservations/${row.orderNo}`)
}

// 4.3.5 取消预约（工作人员代操作）
async function handleCancel(row) {
  let reason = ''
  try {
    const { value } = await ElMessageBox.prompt(
      `确认为「${row.renterName || '该居民'}」取消预约 ${row.orderNo}？可填写取消原因`,
      '代取消预约',
      {
        confirmButtonText: '确认取消',
        cancelButtonText: '放弃操作',
        inputType: 'textarea',
        inputPlaceholder: '如：居民电话告知无法取件',
        type: 'warning'
      }
    )
    reason = value || ''
  } catch {
    return
  }
  try {
    await cancelReservation(row.orderNo, { cancelReason: reason.trim() || undefined })
    ElMessage.success('预约已取消，押金将全额退还')
    fetchList()
  } catch {
    // 错误由拦截器统一提示
  }
}

onMounted(fetchList)
</script>

<style lang="scss" scoped>
.filter-card {
  margin-bottom: var(--space-md);
}

.table-card {
  .slot-cell {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);

    .slot-sep {
      color: var(--text-secondary);
    }
  }

  .deposit {
    margin-right: var(--space-xs);
    font-weight: 600;
    color: var(--color-primary);
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
