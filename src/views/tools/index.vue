<template>
  <div class="tools-page">
    <!-- 查询条件 -->
    <div class="card-box filter-bar">
      <el-form inline class="filter-form" @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="工具名称 / 型号"
            clearable
            class="keyword-input"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="工具类别">
          <el-select
            v-model="query.category"
            placeholder="全部类别"
            clearable
            class="category-select"
            @change="handleSearch"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 工具列表 -->
    <div v-loading="loading" class="tool-grid">
      <el-row :gutter="16">
        <el-col
          v-for="tool in list"
          :key="tool.toolCode"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <div class="tool-card card-box">
            <!-- 封面图 + 状态角标 -->
            <div class="tool-cover">
              <el-image
                :src="tool.imageUrl"
                fit="cover"
                class="cover-img"
                :preview-src-list="tool.imageUrl ? [tool.imageUrl] : []"
                preview-teleported
              >
                <template #error>
                  <div class="cover-placeholder">
                    <el-icon :size="30"><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <el-tag :type="statusTagType(tool.status)" effect="light" class="status-tag">
                {{ statusLabel(tool.status) }}
              </el-tag>
            </div>

            <!-- 工具信息 -->
            <div class="tool-info">
              <div class="tool-name" :title="tool.toolName">{{ tool.toolName }}</div>
              <div class="tool-code">{{ tool.toolCode }}</div>
              <div class="tool-spec" :title="tool.modelSpec">{{ tool.modelSpec }}</div>
              <div class="tool-meta">
                <el-tag size="small" type="info" effect="plain">
                  {{ categoryLabel(tool.category) }}
                </el-tag>
                <span class="deposit">押金 ¥{{ formatAmount(tool.depositAmount) }}</span>
              </div>
              <!-- 仅管理员展示审核入口，跳转工具审核流程 -->
              <div v-if="isAdmin" class="tool-actions">
                <el-button type="primary" plain class="btn-accessible" @click="goAudit(tool)">
                  审核
                </el-button>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-empty v-if="!list.length" description="暂无工具数据" />

      <!-- 分页 -->
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="fetchList"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Picture } from '@element-plus/icons-vue'
import { getToolList } from '@/api/tool'
import request from '@/utils/request'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

// 管理员可见「审核」操作
const isAdmin = computed(() => userStore.role === 'ADMIN')

const loading = ref(false)
const list = ref([])
const total = ref(0)

// 查询参数（与接口 4.2.3 请求参数一致）
const query = reactive({
  keyword: '',
  category: '',
  page: 1,
  pageSize: 10
})

// 枚举字典：优先取自 GET /system/dictionaries，失败时回退本地常量
const FALLBACK_CATEGORIES = [
  { value: 'WX', label: '维修工具' },
  { value: 'YY', label: '园艺工具' },
  { value: 'QJ', label: '清洁工具' },
  { value: 'QT', label: '其他' }
]
const FALLBACK_STATUSES = [
  { value: 'AVAILABLE', label: '可用' },
  { value: 'RESERVED', label: '已预约' },
  { value: 'RENTED', label: '租赁中' },
  { value: 'REPAIRING', label: '维修中' },
  { value: 'SCRAPPED', label: '报废' }
]
const categoryOptions = ref(FALLBACK_CATEGORIES)
const statusOptions = ref(FALLBACK_STATUSES)

async function loadDictionaries() {
  try {
    const data = await request({
      url: '/system/dictionaries',
      method: 'get',
      params: { keys: 'toolCategory,toolStatus' }
    })
    if (data?.toolCategory?.length) categoryOptions.value = data.toolCategory
    if (data?.toolStatus?.length) statusOptions.value = data.toolStatus
  } catch {
    // 请求拦截器已提示，保留本地回退字典
  }
}

const categoryLabel = (value) =>
  categoryOptions.value.find((item) => item.value === value)?.label || value || '-'

const statusLabel = (value) =>
  statusOptions.value.find((item) => item.value === value)?.label || value || '-'

// 状态标签颜色
const STATUS_TAG_TYPES = {
  AVAILABLE: 'success',
  RESERVED: 'warning',
  RENTED: 'primary',
  REPAIRING: 'danger',
  SCRAPPED: 'info'
}
const statusTagType = (value) => STATUS_TAG_TYPES[value] || 'info'

// 押金金额格式化（保留两位小数）
const formatAmount = (amount) =>
  amount === null || amount === undefined ? '-' : Number(amount).toFixed(2)

// 查询工具列表
async function fetchList() {
  loading.value = true
  try {
    const data = await getToolList({
      keyword: query.keyword.trim() || undefined,
      category: query.category || undefined,
      page: query.page,
      pageSize: query.pageSize
    })
    list.value = data?.list || []
    total.value = data?.total || 0
  } finally {
    loading.value = false
  }
}

// 查询：重置回第一页
function handleSearch() {
  query.page = 1
  fetchList()
}

// 每页条数变化：回到第一页重新查询
function handleSizeChange() {
  query.page = 1
  fetchList()
}

// 重置查询条件
function handleReset() {
  query.keyword = ''
  query.category = ''
  handleSearch()
}

// 跳转工具审核流程（4.2.2）
function goAudit(row) {
  router.push({ path: '/tools/audit', query: { toolCode: row.toolCode } })
}

onMounted(() => {
  loadDictionaries()
  fetchList()
})
</script>

<style lang="scss" scoped>
.tools-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.filter-form {
  .keyword-input {
    width: 220px;
  }

  .category-select {
    width: 160px;
  }
}

.tool-grid {
  min-height: 240px;

  // 栅格列之间的纵向间距
  .el-col {
    margin-bottom: var(--space-md);
  }
}

// 卡片：封面图 + 信息区，同行卡片等高
.tool-card {
  height: 100%;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }

  .tool-cover {
    position: relative;
    flex-shrink: 0;

    .cover-img {
      width: 100%;
      height: 150px;
      display: block;
    }

    .cover-placeholder {
      width: 100%;
      height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--fill-color-light, #f5f7fa);
      color: var(--text-placeholder, #a8abb2);
    }

    .status-tag {
      position: absolute;
      top: 8px;
      right: 8px;
    }
  }

  .tool-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-md);

    .tool-name {
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tool-code {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .tool-spec {
      font-size: var(--font-size-sm);
      color: var(--text-regular);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tool-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: var(--space-xs);

      .deposit {
        font-weight: 600;
        color: var(--color-warning, #e6a23c);
      }
    }

    // 审核按钮：撑满卡片宽度，贴合底部
    .tool-actions {
      margin-top: auto;
      padding-top: var(--space-sm);

      .el-button {
        width: 100%;
        margin-left: 0;
      }
    }
  }
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-sm);
}

// 移动端：单列卡片 + 分页居中换行
.is-mobile {
  .pagination-bar {
    justify-content: center;

    :deep(.el-pagination) {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
}
</style>
