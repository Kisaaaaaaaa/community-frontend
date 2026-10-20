<template>
  <div class="record-my-page">
    <!-- 筛选区 -->
    <div class="card-box filter-card">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="工具名称 / 编号"
            clearable
            style="width: 210px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px" @change="handleSearch">
            <el-option
              v-for="item in RECORD_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
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
        <el-table-column label="租赁时段" min-width="176">
          <template #default="{ row }">
            <div class="slot-cell">
              <span>{{ shortDT(row.startTime) }}</span>
              <span class="slot-sep">→</span>
              <span>{{ shortDT(row.endTime) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="实际归还" min-width="110">
          <template #default="{ row }">
            <span v-if="row.actualReturnTime">{{ shortDT(row.actualReturnTime) }}</span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="押金" min-width="84">
          <template #default="{ row }">
            <span class="deposit">¥{{ formatAmount(row.depositAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="86">
          <template #default="{ row }">
            <el-tag :type="recordStatusTag(row.status)" size="small">
              {{ recordStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row)">详情</el-button>
            <el-button
              v-if="canUpdatePicker(row.status)"
              link
              type="warning"
              @click="openPickerDialog(row)"
            >
              修改取件人
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

    <!-- 修改取件人弹窗 -->
    <PickerDialog v-model:visible="pickerDlg.visible" :row="pickerDlg.row" @success="fetchList" />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getMyRecords } from '@/api/rentrecord'
import PickerDialog from '@/components/rentrecord/PickerDialog.vue'
import {
  RECORD_STATUS_OPTIONS,
  canUpdatePicker,
  formatAmount,
  recordStatusLabel,
  recordStatusTag,
  shortDT
} from '@/utils/rentrecord'

const router = useRouter()

const loading = ref(false)
const list = ref([])
const total = ref(0)

const query = reactive({
  keyword: '',
  status: '',
  page: 1,
  pageSize: 10
})

// 4.4.4 我的租赁记录
async function fetchList() {
  loading.value = true
  try {
    const params = { page: query.page, pageSize: query.pageSize }
    if (query.keyword.trim()) params.keyword = query.keyword.trim()
    if (query.status) params.status = query.status
    const data = await getMyRecords(params)
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
  query.status = ''
  query.page = 1
  fetchList()
}

function goDetail(row) {
  router.push(`/records/${row.orderNo}`)
}

// 修改取件人弹窗（4.4.3，仅待取件状态）
const pickerDlg = reactive({ visible: false, row: null })
function openPickerDialog(row) {
  pickerDlg.row = row
  pickerDlg.visible = true
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
