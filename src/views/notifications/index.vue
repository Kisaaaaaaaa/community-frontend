<template>
  <div class="my-notification-page">
    <div class="card-box filter-card">
      <div class="filter-head">
        <div class="title-wrap">
          <h3 class="page-title">我的消息</h3>
          <span class="page-sub">共 {{ total }} 条，{{ unreadCount }} 条未读</span>
        </div>
        <el-button
          type="primary"
          plain
          :disabled="unreadCount === 0"
          :loading="readingAll"
          @click="handleReadAll"
        >
          全部已读
        </el-button>
      </div>

      <el-form :inline="true" @submit.prevent>
        <el-form-item label="已读状态">
          <el-select
            v-model="query.isRead"
            placeholder="全部"
            style="width: 130px"
            @change="handleSearch"
          >
            <el-option label="全部" value="all" />
            <el-option label="未读" value="unread" />
            <el-option label="已读" value="read" />
          </el-select>
        </el-form-item>
        <el-form-item label="提醒类型">
          <el-select
            v-model="query.type"
            placeholder="全部"
            clearable
            style="width: 170px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in NOTIFY_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-loading="loading" class="message-list">
      <article
        v-for="item in list"
        :key="item.notifyId"
        class="message-card card-box"
        :class="{ 'is-unread': !item.isRead }"
      >
        <div class="message-head">
          <div class="message-title-wrap">
            <el-tag :type="notifyTypeTag(item.type)" size="small" effect="light">
              {{ item.typeName || notifyTypeLabel(item.type) }}
            </el-tag>
            <h4 class="message-title">{{ item.title }}</h4>
            <span v-if="!item.isRead" class="unread-label">未读</span>
          </div>
          <time class="message-time">{{ item.sendTime }}</time>
        </div>

        <p class="message-content">{{ item.content }}</p>

        <div class="message-footer">
          <span class="channel-text">站内消息</span>
          <el-button
            v-if="!item.isRead"
            link
            type="primary"
            :loading="readingId === item.notifyId"
            @click="handleRead(item)"
          >
            标记已读
          </el-button>
          <span v-else class="read-text">已读</span>
        </div>
      </article>

      <el-empty v-if="!loading && !list.length" description="暂无站内消息" />
    </div>

    <div v-if="total > 0" class="pagination-wrap">
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
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyNotifications, markNotificationsRead } from '@/api/notification'
import { useNotificationStore } from '@/store/notification'
import { NOTIFY_TYPE_OPTIONS, notifyTypeLabel, notifyTypeTag } from '@/utils/notification'

const notificationStore = useNotificationStore()
const loading = ref(false)
const readingAll = ref(false)
const readingId = ref(null)
const list = ref([])
const total = ref(0)
const unreadCount = ref(0)

const query = reactive({
  isRead: 'all',
  type: '',
  page: 1,
  pageSize: 10
})

async function fetchList() {
  loading.value = true
  try {
    const params = { page: query.page, pageSize: query.pageSize }
    if (query.isRead === 'unread') params.isRead = false
    if (query.isRead === 'read') params.isRead = true
    if (query.type) params.type = query.type

    const data = await getMyNotifications(params)
    list.value = data?.list || []
    total.value = data?.total || 0
    unreadCount.value = data?.unreadCount || 0
    notificationStore.setUnreadCount(unreadCount.value)
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
  query.isRead = 'all'
  query.type = ''
  query.page = 1
  fetchList()
}

async function refreshAfterRead() {
  await fetchList()
}

async function handleRead(item) {
  readingId.value = item.notifyId
  try {
    await markNotificationsRead([item.notifyId])
    ElMessage.success('已标记为已读')
    await refreshAfterRead()
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    readingId.value = null
  }
}

async function handleReadAll() {
  readingAll.value = true
  try {
    const data = await markNotificationsRead([])
    ElMessage.success(`已标记 ${data?.readCount || 0} 条消息为已读`)
    await refreshAfterRead()
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    readingAll.value = false
  }
}

watch(
  () => notificationStore.unreadCount,
  (next, prev) => {
    if (typeof prev === 'number' && next > prev) {
      fetchList()
    }
  }
)

onMounted(fetchList)
</script>

<style lang="scss" scoped>
.filter-card {
  margin-bottom: var(--space-md);
}

.filter-head,
.title-wrap,
.message-head,
.message-title-wrap,
.message-footer {
  display: flex;
  align-items: center;
}

.filter-head {
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.title-wrap {
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.page-title {
  margin: 0;
  padding-left: var(--space-sm);
  border-left: 4px solid var(--color-primary);
  font-size: var(--font-size-lg);
  line-height: 1.2;
}

.page-sub,
.message-time,
.channel-text,
.read-text {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.message-list {
  min-height: 160px;
}

.message-card {
  margin-bottom: var(--space-md);
  border-left: 3px solid transparent;

  &.is-unread {
    border-left-color: var(--color-primary);
    background: var(--color-primary-light-9, #ecf5ff);
  }
}

.message-head {
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
}

.message-title-wrap {
  flex-wrap: wrap;
  gap: var(--space-sm);
  min-width: 0;
}

.message-title {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: 600;
}

.unread-label {
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}

.message-time {
  flex-shrink: 0;
}

.message-content {
  margin: var(--space-md) 0;
  color: var(--text-regular);
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-footer {
  justify-content: space-between;
  min-height: 24px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .message-head {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .pagination-wrap {
    justify-content: center;
  }
}
</style>
