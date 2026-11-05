<template>
  <div class="notification-records-page">
    <div class="card-box filter-card">
      <div class="filter-head">
        <h3 class="page-title">提醒发送记录</h3>
        <span class="page-sub">共 {{ total }} 条记录</span>
      </div>

      <el-form :inline="true" @submit.prevent>
        <el-form-item label="提醒类型">
          <el-select v-model="query.type" placeholder="全部" clearable style="width: 160px">
            <el-option
              v-for="item in NOTIFY_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="提醒方式">
          <el-select v-model="query.channel" placeholder="全部" clearable style="width: 140px">
            <el-option label="站内消息" value="IN_APP" />
          </el-select>
        </el-form-item>
        <el-form-item label="接收状态">
          <el-select v-model="query.receiveStatus" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in RECEIVE_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="业务单号">
          <el-input
            v-model="query.bizNo"
            placeholder="预约单号 / 维修单号"
            clearable
            style="width: 190px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="提醒时间">
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

    <div class="card-box table-card">
      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column label="序号" width="70">
          <template #default="{ $index }">
            {{ (query.page - 1) * query.pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="接收人" min-width="110">
          <template #default="{ row }">{{ row.userName || '-' }}</template>
        </el-table-column>
        <el-table-column label="提醒类型" min-width="140">
          <template #default="{ row }">
            <el-tag :type="notifyTypeTag(row.type)" size="small" effect="light">
              {{ row.typeName || notifyTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bizId" label="业务单号" min-width="160">
          <template #default="{ row }">{{ row.bizId || '-' }}</template>
        </el-table-column>
        <el-table-column label="提醒方式" width="110">
          <template #default>站内消息</template>
        </el-table-column>
        <el-table-column prop="sendTime" label="提醒时间" min-width="150" />
        <el-table-column label="接收状态" width="110">
          <template #default="{ row }">
            <el-tag :type="receiveStatusTag(row.receiveStatus)" size="small">
              {{ receiveStatusLabel(row.receiveStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无提醒发送记录" />
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
import { getNotificationRecords } from '@/api/notification'
import {
  NOTIFY_TYPE_OPTIONS,
  RECEIVE_STATUS_OPTIONS,
  notifyTypeLabel,
  notifyTypeTag,
  receiveStatusLabel,
  receiveStatusTag
} from '@/utils/notification'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const dateRange = ref([])

const query = reactive({
  type: '',
  channel: '',
  receiveStatus: '',
  bizNo: '',
  page: 1,
  pageSize: 10
})

async function fetchList() {
  loading.value = true
  try {
    const params = { page: query.page, pageSize: query.pageSize }
    if (query.type) params.type = query.type
    if (query.channel) params.channel = query.channel
    if (query.receiveStatus) params.receiveStatus = query.receiveStatus
    if (query.bizNo.trim()) params.bizNo = query.bizNo.trim()
    if (dateRange.value?.length === 2) {
      params.dateStart = dateRange.value[0]
      params.dateEnd = dateRange.value[1]
    }

    const data = await getNotificationRecords(params)
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
  query.type = ''
  query.channel = ''
  query.receiveStatus = ''
  query.bizNo = ''
  dateRange.value = []
  query.page = 1
  fetchList()
}

onMounted(fetchList)
</script>

<style lang="scss" scoped>
.filter-card {
  margin-bottom: var(--space-md);
}

.filter-head {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.page-title {
  margin: 0;
  padding-left: var(--space-sm);
  border-left: 4px solid var(--color-primary);
  font-size: var(--font-size-lg);
  line-height: 1.2;
}

.page-sub {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-md);
  overflow-x: auto;
}

@media (max-width: 768px) {
  .pagination-wrap {
    justify-content: center;
  }
}
</style>
