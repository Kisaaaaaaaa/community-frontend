<template>
  <div class="repair-manage-page">
    <!-- 筛选区 -->
    <div class="card-box filter-card">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="报修单号">
          <el-input
            v-model="query.repairNo"
            placeholder="SQ-BX-YYYYMMDD-NNNN"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="工具编号">
          <el-input
            v-model="query.toolCode"
            placeholder="如 SQ-G-WX-0001"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="报修人">
          <el-input
            v-model="query.reporterName"
            placeholder="姓名模糊搜索"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="核验结果">
          <el-select v-model="query.verifyResult" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="it in VERIFY_RESULT_OPTIONS"
              :key="it.value" :label="it.label" :value="it.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="维修进度">
          <el-select v-model="query.progressStatus" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="it in PROGRESS_STATUS_OPTIONS"
              :key="it.value" :label="it.label" :value="it.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="报修时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
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
        <el-table-column prop="repairNo" label="报修单号" width="220" />
        <el-table-column prop="toolCode" label="工具编号" width="150" />
        <el-table-column prop="toolName" label="工具名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="reporterName" label="报修人" width="110" />
        <el-table-column label="报修状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ repairStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="核验" width="100">
          <template #default="{ row }">
            <el-tag
              v-if="row.verifyResult"
              :type="verifyResultTagType(row.verifyResult)"
              size="small"
            >{{ verifyResultLabel(row.verifyResult) }}</el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="维修进度" width="110">
          <template #default="{ row }">
            <el-tag
              v-if="row.progressStatus"
              :type="progressTagType(row.progressStatus)"
              size="small"
            >{{ progressLabel(row.progressStatus) }}</el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="160" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row.repairNo)">详情 / 处理</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无报修单" />
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
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getManageRepairs,
  REPAIR_STATUS,
  REPAIR_STATUS_OPTIONS,
  VERIFY_RESULT_OPTIONS,
  PROGRESS_STATUS_OPTIONS
} from '@/api/repair'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const isAdmin = computed(() => userStore.role === 'ADMIN' || userStore.role === 'STAFF')

const loading = ref(false)
const list = ref([])
const total = ref(0)
const dateRange = ref([])

const query = reactive({
  repairNo: '',
  toolCode: '',
  reporterName: '',
  verifyResult: '',
  progressStatus: '',
  page: 1,
  pageSize: 10
})

// 字典
const repairStatusLabel = (v) => REPAIR_STATUS_OPTIONS.find(o => o.value === v)?.label || v
const verifyResultLabel = (v) => VERIFY_RESULT_OPTIONS.find(o => o.value === v)?.label || v
const progressLabel = (v) => PROGRESS_STATUS_OPTIONS.find(o => o.value === v)?.label || v

const statusTagType = (v) => {
  const map = {
    [REPAIR_STATUS.SUBMITTED]: 'warning',
    [REPAIR_STATUS.VERIFYING]: 'warning',
    [REPAIR_STATUS.REPAIRING]: 'primary',
    [REPAIR_STATUS.REPAIRED]: 'success',
    [REPAIR_STATUS.CLOSED]: 'info',
    [REPAIR_STATUS.REJECTED]: 'danger'
  }
  return map[v] || 'info'
}
const verifyResultTagType = (v) => {
  if (v === 'CONFIRMED') return 'danger'
  if (v === 'SUSPECTED') return 'warning'
  if (v === 'FALSE_REPORT') return 'info'
  return 'info'
}
const progressTagType = (v) => {
  if (v === 'WAIT_PART') return 'warning'
  if (v === 'REPAIRING') return 'primary'
  if (v === 'REPAIRED') return 'success'
  if (v === 'FAILED') return 'danger'
  return 'info'
}

async function fetchList() {
  loading.value = true
  try {
    const params = { page: query.page, pageSize: query.pageSize }
    if (query.repairNo.trim()) params.repairNo = query.repairNo.trim()
    if (query.toolCode.trim()) params.toolCode = query.toolCode.trim()
    if (query.reporterName.trim()) params.reporterName = query.reporterName.trim()
    if (query.verifyResult) params.verifyResult = query.verifyResult
    if (query.progressStatus) params.progressStatus = query.progressStatus
    if (dateRange.value?.length === 2) {
      params.dateStart = dateRange.value[0]
      params.dateEnd = dateRange.value[1]
    }
    const data = await getManageRepairs(params)
    list.value = data?.list || []
    total.value = data?.total || 0
  } catch (e) {
    // request.js 已统一处理提示
  } finally {
    loading.value = false
  }
}

function handleSearch() { query.page = 1; fetchList() }
function handleReset() {
  query.repairNo = ''; query.toolCode = ''; query.reporterName = ''
  query.verifyResult = ''; query.progressStatus = ''
  dateRange.value = []; query.page = 1
  fetchList()
}
function handleSizeChange() { query.page = 1; fetchList() }

function goDetail(repairNo) {
  router.push({ name: 'RepairDetail', params: { repairNo } })
}

onMounted(() => {
  if (!isAdmin.value) {
    ElMessage.warning('仅工作人员 / 管理员可访问')
    router.replace('/home')
    return
  }
  fetchList()
})
</script>

<style lang="scss" scoped>
.repair-manage-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
.filter-card { margin-bottom: 0; }
.table-card {
  .pagination-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--space-md);
  }
}
.muted { color: var(--text-placeholder); }

@media (max-width: 768px) {
  .table-card .pagination-wrap { justify-content: center; }
}
</style>
