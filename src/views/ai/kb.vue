<template>
  <div class="kb-page">
    <!-- 顶部 -->
    <div class="card-box kb-hero">
      <div class="kb-hero-text">
        <h2>知识库文档</h2>
        <p>上传工具操作手册、安全警示与租赁规则，解析入库后即可被 AI 问答检索引用</p>
      </div>
      <el-button v-if="isAdmin" type="primary" round :icon="UploadFilled" @click="openUpload">
        上传文档
      </el-button>
    </div>

    <!-- 筛选 -->
    <div class="card-box kb-filter">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="文档类型">
          <el-select v-model="query.docType" placeholder="全部" clearable style="width: 150px">
            <el-option
              v-for="it in KB_DOC_TYPE_OPTIONS"
              :key="it.value" :label="it.label" :value="it.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="解析状态">
          <el-select v-model="query.parseStatus" placeholder="全部" clearable style="width: 150px">
            <el-option
              v-for="it in PARSE_STATUS_OPTIONS"
              :key="it.value" :label="it.label" :value="it.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 列表 -->
    <div class="card-box">
      <div class="table-head">
        <h3>文档列表</h3>
        <span class="table-head-hint">共 {{ total }} 个文档</span>
      </div>

      <el-table v-loading="loading" :data="list" stripe row-key="docId">
        <el-table-column prop="docId" label="ID" width="80" />
        <el-table-column prop="docName" label="文档名称" min-width="190" show-overflow-tooltip />
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="docTypeTagType(row.docType)" effect="plain">
              {{ docTypeLabel(row.docType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="源文件名" min-width="190" show-overflow-tooltip />
        <el-table-column label="大小" width="100">
          <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column prop="chunkCount" label="切片" width="80" />
        <el-table-column label="解析状态" width="150">
          <template #default="{ row }">
            <div class="status-cell">
              <el-tag size="small" :type="parseStatusTagType(row.parseStatus)">
                {{ parseStatusLabel(row.parseStatus) }}
              </el-tag>
              <el-progress
                v-if="row.parseStatus === 'PARSING'"
                :percentage="row.parseProgress || 0"
                :stroke-width="4"
                :show-text="false"
                class="status-progress"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="uploader" label="上传人" width="120" show-overflow-tooltip />
        <el-table-column prop="uploadTime" label="上传时间" width="150" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" @click="openStatus(row)">详情</el-button>
              <el-button v-if="isAdmin" link type="danger" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无知识库文档">
            <el-button v-if="isAdmin" type="primary" round :icon="UploadFilled" @click="openUpload">
              上传第一份文档
            </el-button>
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

    <!-- 上传弹窗 -->
    <el-dialog v-model="uploadVisible" title="上传知识库文档" width="620px" destroy-on-close>
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="90px">
        <el-form-item label="文档名称" prop="docName">
          <el-input v-model="uploadForm.docName" maxlength="200" show-word-limit placeholder="如：冲击电钻操作手册" />
        </el-form-item>
        <el-form-item label="文档类型" prop="docType">
          <el-radio-group v-model="uploadForm.docType">
            <el-radio v-for="it in KB_DOC_TYPE_OPTIONS" :key="it.value" :label="it.value">
              {{ it.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="文件">
          <el-upload
            v-model:file-list="fileList"
            class="uploader"
            drag
            multiple
            :auto-upload="false"
            :limit="10"
            accept=".pdf,.docx,.jpg,.jpeg,.png"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽文件到此处，或 <em>点击选择</em></div>
            <template #tip>
              <div class="el-upload__tip">
                支持 PDF / DOCX / JPG / JPEG / PNG，单个不超过 20MB，最多 10 个文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleUploadSubmit">
          {{ submitting ? '上传解析中…' : '提交解析' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 解析状态详情 -->
    <el-dialog v-model="statusVisible" title="解析状态详情" width="520px">
      <div v-if="statusDoc" class="status-detail">
        <div class="kv-line">
          <span class="kv-k">文档名称</span>
          <span class="kv-v">{{ statusDoc.docName }}</span>
        </div>
        <div class="kv-line">
          <span class="kv-k">解析状态</span>
          <el-tag size="small" :type="parseStatusTagType(statusStatus.parseStatus)">
            {{ parseStatusLabel(statusStatus.parseStatus) }}
          </el-tag>
        </div>
        <div class="kv-line">
          <span class="kv-k">解析进度</span>
          <el-progress
            :percentage="statusStatus.parseProgress || 0"
            :status="statusStatus.parseStatus === 'FAILED' ? 'exception' : undefined"
            class="kv-progress"
          />
        </div>
        <div class="kv-line">
          <span class="kv-k">切片数量</span>
          <span class="kv-v">{{ statusStatus.chunkCount || 0 }}</span>
        </div>
        <div v-if="statusStatus.failReason" class="fail-box">
          <el-icon><WarningFilled /></el-icon>
          <span>{{ statusStatus.failReason }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="refreshStatus" :loading="statusLoading">刷新状态</el-button>
        <el-button type="primary" @click="statusVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  RefreshLeft, Search, UploadFilled, WarningFilled
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import {
  KB_DOC_TYPE,
  KB_DOC_TYPE_OPTIONS,
  PARSE_STATUS_OPTIONS,
  createKbDocument,
  deleteKbDocument,
  docTypeLabel,
  getKbDocumentStatus,
  getKbDocuments,
  parseStatusLabel,
  parseStatusTagType
} from '@/api/ai'
import { uploadFile } from '@/api/file'

const MAX_FILE_SIZE = 20 * 1024 * 1024
const ALLOWED_EXT = ['pdf', 'docx', 'jpg', 'jpeg', 'png']

const router = useRouter()
const userStore = useUserStore()
const isAdmin = computed(() => userStore.role === 'ADMIN')

const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({
  docType: '',
  parseStatus: '',
  page: 1,
  pageSize: 10
})

const uploadVisible = ref(false)
const submitting = ref(false)
const uploadFormRef = ref(null)
const uploadForm = reactive({
  docName: '',
  docType: KB_DOC_TYPE.MANUAL
})
const fileList = ref([])

const uploadRules = {
  docName: [{ required: true, message: '请填写文档名称', trigger: 'blur' }],
  docType: [{ required: true, message: '请选择文档类型', trigger: 'change' }]
}

const statusVisible = ref(false)
const statusLoading = ref(false)
const statusDoc = ref(null)
const statusStatus = ref({ parseStatus: '', parseProgress: 0, chunkCount: 0, failReason: null })

const isParsing = (s) => s === 'PENDING' || s === 'PARSING'

function docTypeTagType(value) {
  if (value === 'MANUAL') return 'primary'
  if (value === 'SAFETY') return 'warning'
  return 'success'
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// ================== 列表 ==================

async function fetchList() {
  loading.value = true
  try {
    const params = {
      page: query.page,
      pageSize: query.pageSize
    }
    if (query.docType) params.docType = query.docType
    if (query.parseStatus) params.parseStatus = query.parseStatus
    const data = await getKbDocuments(params)
    list.value = (data?.list || []).map((it) => ({ ...it, parseProgress: it.parseProgress ?? 0 }))
    total.value = data?.total || 0
    startPolling()
  } catch (e) {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function handleReset() {
  query.docType = ''
  query.parseStatus = ''
  query.page = 1
  fetchList()
}

function handleSizeChange() {
  query.page = 1
  fetchList()
}

// ================== 解析状态轮询 ==================

let pollTimer = null

function startPolling() {
  if (pollTimer) return
  if (!list.value.some((it) => isParsing(it.parseStatus))) return
  pollTimer = setInterval(async () => {
    const pending = list.value.filter((it) => isParsing(it.parseStatus))
    if (!pending.length) {
      stopPolling()
      return
    }
    await Promise.all(pending.map(async (row) => {
      try {
        const s = await getKbDocumentStatus(row.docId)
        row.parseStatus = s.parseStatus
        row.parseProgress = s.parseProgress ?? 0
        row.chunkCount = s.chunkCount ?? row.chunkCount
        row.failReason = s.failReason ?? null
      } catch (e) {
        // 单条失败不影响其它轮询
      }
    }))
  }, 2500)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// ================== 上传 ==================

function openUpload() {
  uploadForm.docName = ''
  uploadForm.docType = KB_DOC_TYPE.MANUAL
  fileList.value = []
  uploadVisible.value = true
}

function validateFiles() {
  const files = fileList.value.map((it) => it.raw).filter(Boolean)
  if (!files.length) {
    ElMessage.warning('请先选择要上传的文件')
    return null
  }
  if (files.length > 10) {
    ElMessage.warning('单个文档最多关联 10 个文件')
    return null
  }
  for (const f of files) {
    const ext = (f.name.split('.').pop() || '').toLowerCase()
    if (!ALLOWED_EXT.includes(ext)) {
      ElMessage.warning(`文件 ${f.name} 格式不支持，仅支持 PDF / DOCX / JPG / JPEG / PNG`)
      return null
    }
    if (f.size > MAX_FILE_SIZE) {
      ElMessage.warning(`文件 ${f.name} 超过 20MB 限制`)
      return null
    }
  }
  return files
}

async function handleUploadSubmit() {
  await uploadFormRef.value.validate()
  const files = validateFiles()
  if (!files) return

  submitting.value = true
  try {
    // 1. 逐个上传取得 fileId（usage=KB_DOC）
    const fileIds = []
    for (const f of files) {
      const res = await uploadFile(f, 'KB_DOC')
      fileIds.push(res.fileId)
    }

    // 2. 建立知识库文档，服务端异步解析
    await createKbDocument({
      docName: uploadForm.docName.trim(),
      docType: uploadForm.docType,
      fileIds
    })

    ElMessage.success('已提交，文档正在后台解析')
    uploadVisible.value = false
    query.page = 1
    await fetchList()
  } catch (e) {
    // 错误提示由 request 拦截器统一处理
  } finally {
    submitting.value = false
  }
}

// ================== 详情 / 删除 ==================

function openStatus(row) {
  statusDoc.value = row
  statusStatus.value = {
    parseStatus: row.parseStatus,
    parseProgress: row.parseProgress || 0,
    chunkCount: row.chunkCount || 0,
    failReason: row.failReason || null
  }
  statusVisible.value = true
  refreshStatus()
}

async function refreshStatus() {
  if (!statusDoc.value) return
  statusLoading.value = true
  try {
    const s = await getKbDocumentStatus(statusDoc.value.docId)
    statusStatus.value = s
    // 同步回列表行
    statusDoc.value.parseStatus = s.parseStatus
    statusDoc.value.parseProgress = s.parseProgress ?? 0
    statusDoc.value.chunkCount = s.chunkCount ?? statusDoc.value.chunkCount
    statusDoc.value.failReason = s.failReason ?? null
  } catch (e) {
    // 拦截器已提示
  } finally {
    statusLoading.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除文档「${row.docName}」吗？删除后 AI 问答将不再检索其内容，且不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }

  try {
    await deleteKbDocument(row.docId)
    ElMessage.success('已删除')
    if (list.value.length === 1 && query.page > 1) query.page -= 1
    await fetchList()
  } catch (e) {
    // 拦截器已提示
  }
}

onMounted(() => {
  if (userStore.role !== 'STAFF' && userStore.role !== 'ADMIN') {
    router.replace('/home')
    return
  }
  fetchList()
})

onBeforeUnmount(stopPolling)
</script>

<style lang="scss" scoped>
.kb-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.kb-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);

  h2 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  p {
    margin: 6px 0 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}

.kb-hero-text {
  min-width: 0;
}

.table-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-md);

  h3 {
    margin: 0;
    font-size: var(--font-size-base);
    color: var(--text-primary);
  }
}

.table-head-hint {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.status-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.status-progress {
  width: 100%;
}

.row-actions {
  white-space: nowrap;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-md);
}

.uploader {
  width: 100%;
}

/* 状态详情 */
.status-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.kv-line {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.kv-k {
  width: 80px;
  flex-shrink: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.kv-v {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  word-break: break-all;
}

.kv-progress {
  flex: 1;
}

.fail-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background-color: rgba(245, 108, 108, 0.08);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .kb-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
