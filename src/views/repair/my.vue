<template>
  <div class="repair-my-page">
    <!-- 顶部卡片 -->
    <div class="card-box top-bar">
      <div class="top-bar-text">
        <h2>我的报修</h2>
        <p>提交的损坏报修单及其处理进度</p>
      </div>
      <el-button type="primary" round :icon="Plus" @click="goSubmit">
        提交报修
      </el-button>
    </div>

    <!-- 筛选区 -->
    <div class="card-box filter-card">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 160px">
            <el-option
              v-for="it in REPAIR_STATUS_OPTIONS"
              :key="it.value" :label="it.label" :value="it.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 列表 -->
    <div class="card-box">
      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column prop="repairNo" label="报修单号" width="220" />
        <el-table-column prop="toolName" label="工具" min-width="160" show-overflow-tooltip />
        <el-table-column prop="damagePart" label="损坏部位" width="130" />
        <el-table-column label="报修状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ repairStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="维修进度" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.progressStatus" :type="progressTagType(row.progressStatus)" size="small">
              {{ progressLabel(row.progressStatus) }}
            </el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="160" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row.repairNo)">查看详情</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无报修记录">
            <el-button type="primary" round :icon="Plus" @click="goSubmit">去提交报修</el-button>
          </el-empty>
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
import { Plus } from '@element-plus/icons-vue'
import {
  getMyRepairs,
  REPAIR_STATUS,
  REPAIR_STATUS_OPTIONS,
  PROGRESS_STATUS_OPTIONS
} from '@/api/repair'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const list = ref([])
const total = ref(0)

const query = reactive({ status: '', page: 1, pageSize: 10 })

const repairStatusLabel = (v) => REPAIR_STATUS_OPTIONS.find(o => o.value === v)?.label || v
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
    if (query.status) params.status = query.status
    const data = await getMyRepairs(params)
    list.value = data?.list || []
    total.value = data?.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() { query.page = 1; fetchList() }
function handleReset() { query.status = ''; query.page = 1; fetchList() }
function handleSizeChange() { query.page = 1; fetchList() }
function goDetail(repairNo) { router.push({ name: 'RepairDetail', params: { repairNo } }) }
function goSubmit() { router.push({ name: 'RepairSubmit' }) }

onMounted(() => {
  if (userStore.role !== 'RESIDENT') {
    ElMessage.warning('仅居民可提交报修')
    router.replace('/home')
    return
  }
  fetchList()
})
</script>

<style lang="scss" scoped>
.repair-my-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .top-bar-text h2 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
  }
  .top-bar-text p {
    margin: 4px 0 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-md);
}
.muted { color: var(--text-placeholder); }
@media (max-width: 768px) {
  .pagination-wrap { justify-content: center; }
}
</style>
