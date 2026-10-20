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
      <!-- 仅工作人员可录入新工具（弹窗形式） -->
      <el-button v-if="isStaff" type="primary" plain class="btn-accessible" @click="openCreate">
        录入工具
      </el-button>
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
              <!-- 管理员操作：待审核工具可审核，可用状态工具可删除（确认弹窗） -->
              <div
                v-if="isAdmin && (tool.auditStatus === 'PENDING' || tool.status === 'AVAILABLE')"
                class="tool-actions"
              >
                <el-button
                  v-if="tool.auditStatus === 'PENDING'"
                  type="primary"
                  plain
                  class="btn-accessible"
                  @click="openAudit(tool)"
                >
                  审核
                </el-button>
                <el-button
                  v-if="tool.status === 'AVAILABLE'"
                  type="danger"
                  plain
                  class="btn-accessible"
                  :loading="deletingCode === tool.toolCode"
                  @click="handleDelete(tool)"
                >
                  删除
                </el-button>
              </div>
              <!-- 居民：可用工具可发起预约（4.3.3） -->
              <div v-if="canBook(tool)" class="tool-actions">
                <el-button type="success" plain class="btn-accessible" @click="goBooking(tool)">
                  预约
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
    <!-- 工具录入弹窗（4.2.1：工具编码系统自动生成，录入后进入待审核状态） -->
    <el-dialog
      v-model="createVisible"
      title="工具录入"
      width="720px"
      class="tool-create-dialog"
      destroy-on-close
    >
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="工具编码由系统按 SQ-G-XX-YYYY 规则自动生成，录入后进入「待审核」状态"
        class="mb-md"
      />
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="110px"
        @submit.prevent
      >
        <el-form-item label="工具名称" prop="toolName">
          <el-input v-model="createForm.toolName" maxlength="100" placeholder="如：冲击电钻" />
        </el-form-item>
        <el-form-item label="型号规格" prop="modelSpec">
          <el-input v-model="createForm.modelSpec" maxlength="200" placeholder="含品牌、尺寸等参数" />
          <div v-if="createForm.category === 'QT'" class="field-tip">类别为「其他」时，须在型号规格中注明</div>
        </el-form-item>
        <el-form-item label="工具类别" prop="category">
          <el-select v-model="createForm.category" placeholder="请选择类别" class="select-input">
            <el-option
              v-for="item in CATEGORY_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="初始损坏程度" prop="initialDamageLevel">
          <el-select v-model="createForm.initialDamageLevel" placeholder="请选择损坏程度" class="select-input">
            <el-option
              v-for="item in DAMAGE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <div v-if="createForm.initialDamageLevel === 4" class="field-tip warning">
            损坏程度为 4（严重损坏）的工具录入后不可审核通过，需先完成维修
          </div>
        </el-form-item>
        <el-form-item label="押金金额（元）" prop="depositAmount">
          <el-input-number
            v-model="createForm.depositAmount"
            :min="0.01"
            :precision="2"
            :step="10"
            :controls="false"
            placeholder="按工具价值设定"
            class="select-input"
          />
        </el-form-item>
        <el-form-item label="存放区域" prop="storageLocation">
          <el-input v-model="createForm.storageLocation" maxlength="100" placeholder="格式：社区服务站-柜体编号，如：社区服务站-A柜-03格" />
        </el-form-item>
        <el-form-item label="使用说明" prop="usageText">
          <el-input
            v-model="createForm.usageText"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
            placeholder="分点描述操作流程，如：1.检查电源线；2.安装钻头；3.佩戴护目镜后操作"
          />
        </el-form-item>
        <el-form-item label="说明示意图" prop="usageImageIds">
          <el-upload
            v-model:file-list="usageImageList"
            action="#"
            list-type="picture-card"
            accept=".jpg,.jpeg,.png"
            multiple
            :limit="5"
            :http-request="doUpload"
            :before-upload="beforeImageUpload"
            :on-preview="handlePreview"
            :on-change="() => createFormRef?.validateField('usageImageIds')"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="field-tip">使用说明示意图，JPG/PNG，单张不超过 5MB，最多 5 张</div>
        </el-form-item>

        <el-form-item label="工具图片" prop="toolImageIds">
          <el-upload
            v-model:file-list="toolImageList"
            action="#"
            list-type="picture-card"
            accept=".jpg,.jpeg,.png"
            multiple
            :limit="5"
            :http-request="doUpload"
            :before-upload="beforeImageUpload"
            :on-preview="handlePreview"
            :on-change="() => createFormRef?.validateField('toolImageIds')"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="field-tip">工具实物图片，JPG/PNG，单张不超过 5MB，最多 5 张</div>
        </el-form-item>
        <el-form-item label="采购日期" prop="purchaseDate">
          <el-date-picker
            v-model="createForm.purchaseDate"
            type="date"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledPurchaseDate"
            placeholder="选择日期（可选）"
            class="select-input"
          />
        </el-form-item>
        <el-form-item label="供应商信息" prop="supplierInfo">
          <el-input v-model="createForm.supplierInfo" maxlength="200" placeholder="供应商名称及联系方式（可选）" />
        </el-form-item>
      </el-form>
      <el-image-viewer
        v-if="previewVisible"
        :url-list="[previewUrl]"
        @close="previewVisible = false"
      />
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreateSubmit">提交录入</el-button>
      </template>
    </el-dialog>

    <!-- 工具审核弹窗（4.2.2，仅管理员） -->
    <el-dialog v-model="auditVisible" title="工具审核" width="560px" destroy-on-close>
      <el-descriptions :column="2" border size="small" class="mb-md">
        <el-descriptions-item label="工具编码" :span="2">
          {{ auditTarget?.toolCode }}
        </el-descriptions-item>
        <el-descriptions-item label="工具名称">{{ auditTarget?.toolName }}</el-descriptions-item>
        <el-descriptions-item label="类别">{{ categoryLabel(auditTarget?.category) }}</el-descriptions-item>
        <el-descriptions-item label="型号规格" :span="2">{{ auditTarget?.modelSpec || '-' }}</el-descriptions-item>
        <el-descriptions-item label="押金（元）">¥{{ formatAmount(auditTarget?.depositAmount) }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">{{ statusLabel(auditTarget?.status) }}</el-descriptions-item>
      </el-descriptions>
      <el-form
        ref="auditFormRef"
        :model="auditForm"
        :rules="auditRules"
        label-width="90px"
        @submit.prevent
      >
        <el-form-item label="审核结果" prop="auditStatus">
          <el-radio-group v-model="auditForm.auditStatus">
            <el-radio value="APPROVED">审核通过</el-radio>
            <el-radio value="REJECTED">需修改</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="auditForm.auditStatus === 'REJECTED'"
          label="修改意见"
          prop="auditRemark"
        >
          <el-input
            v-model="auditForm.auditRemark"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="请填写需修改的内容，录入人将按此更正后重新提交"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" :loading="auditing" @click="handleAuditSubmit">
          提交审核结果
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Picture, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { uploadImage } from '@/api/file'
import { auditTool, createTool, deleteTool, getToolList } from '@/api/tool'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

// 管理员可见「审核」操作，工作人员可见「录入工具」入口
const isAdmin = computed(() => userStore.role === 'ADMIN')
const isStaff = computed(() => userStore.role === 'STAFF')
const isResident = computed(() => userStore.role === 'RESIDENT')

// 仅居民可对「可用」工具发起预约（4.3.3）
const canBook = (tool) => isResident.value && tool.status === 'AVAILABLE'

function goBooking(tool) {
  router.push({
    path: '/reservations/create',
    query: {
      toolCode: tool.toolCode,
      toolName: tool.toolName,
      depositAmount: tool.depositAmount
    }
  })
}

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

// 工具类别选项（4.2.3：WX / YY / QJ / QT）
const CATEGORY_OPTIONS = [
  { value: 'WX', label: '维修工具' },
  { value: 'YY', label: '园艺工具' },
  { value: 'QJ', label: '清洁工具' },
  { value: 'QT', label: '其他' }
]
// 工具状态中文映射
const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: '可用' },
  { value: 'RESERVED', label: '已预约' },
  { value: 'RENTED', label: '租赁中' },
  { value: 'REPAIRING', label: '维修中' },
  { value: 'SCRAPPED', label: '报废' }
]
const categoryOptions = CATEGORY_OPTIONS

const categoryLabel = (value) =>
  CATEGORY_OPTIONS.find((item) => item.value === value)?.label || value || '-'

const statusLabel = (value) =>
  STATUS_OPTIONS.find((item) => item.value === value)?.label || value || '-'

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

// ---------- 工具审核弹窗（4.2.2，仅管理员） ----------
const auditVisible = ref(false)
const auditing = ref(false)
const auditFormRef = ref()
const auditTarget = ref(null)
const auditForm = reactive({ auditStatus: 'APPROVED', auditRemark: '' })

// 驳回时修改意见必填（与后端校验一致）
const auditRules = {
  auditRemark: [{ required: true, message: '请填写修改意见', trigger: 'blur' }]
}

// 打开审核弹窗
function openAudit(tool) {
  auditTarget.value = tool
  auditForm.auditStatus = 'APPROVED'
  auditForm.auditRemark = ''
  auditVisible.value = true
}

// 提交审核（PUT /tools/{toolCode}/audit）
async function handleAuditSubmit() {
  // 驳回时先校验修改意见；通过时无需校验（修改意见不渲染）
  if (auditForm.auditStatus === 'REJECTED') {
    try {
      await auditFormRef.value.validate()
    } catch {
      return
    }
  }
  auditing.value = true
  try {
    await auditTool(auditTarget.value.toolCode, {
      auditStatus: auditForm.auditStatus,
      auditRemark:
        auditForm.auditStatus === 'REJECTED' ? auditForm.auditRemark.trim() : undefined
    })
    auditVisible.value = false
    ElMessage.success(
      auditForm.auditStatus === 'APPROVED'
        ? '审核通过，工具已开放预约'
        : '已驳回，等待录入人修改后重新提交'
    )
    fetchList()
  } catch {
    // 失败原因已由请求拦截器统一弹出（如：工具当前审核状态不允许审核）
  } finally {
    auditing.value = false
  }
}

// ---------- 工具删除 ----------
// 仅 tool_status 为 AVAILABLE 的工具可删除；已删除工具后端已过滤，不会出现在列表
const deletingCode = ref('')

async function handleDelete(tool) {
  try {
    await ElMessageBox.confirm(
      `确定删除工具「${tool.toolName}」（${tool.toolCode}）吗？删除后列表不再展示，历史记录仍可追溯。`,
      '删除工具',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  deletingCode.value = tool.toolCode
  try {
    await deleteTool(tool.toolCode)
    ElMessage.success('工具已删除')
    fetchList()
  } catch {
    // 失败原因已由请求拦截器统一弹出（如：工具存在进行中业务，不允许删除）
  } finally {
    deletingCode.value = ''
  }
}

// ---------- 工具录入弹窗（4.2.1） ----------
// 初始损坏程度（4.2.1：1-4）
const DAMAGE_OPTIONS = [
  { value: 1, label: '1 - 全新' },
  { value: 2, label: '2 - 轻微磨损' },
  { value: 3, label: '3 - 中度磨损' },
  { value: 4, label: '4 - 严重损坏' }
]

const createVisible = ref(false)
const createFormRef = ref()
const submitting = ref(false)

const emptyCreateForm = () => ({
  toolName: '',
  modelSpec: '',
  category: '',
  initialDamageLevel: undefined,
  depositAmount: undefined,
  storageLocation: '',
  usageText: '',
  purchaseDate: '',
  supplierInfo: ''
})

const createForm = reactive(emptyCreateForm())

// ---------- 图片上传（说明示意图 / 工具图片） ----------
const usageImageList = ref([])
const toolImageList = ref([])
const previewVisible = ref(false)
const previewUrl = ref('')

// 上传前校验：JPG/PNG、单张 ≤5MB
function beforeImageUpload(file) {
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    ElMessage.error('仅支持 JPG/PNG 格式图片')
    return false
  }
  if (file.size / 1024 / 1024 > 5) {
    ElMessage.error('单张图片不能超过 5MB')
    return false
  }
  return true
}

// 自定义上传：调后端上传接口，成功后文件对象上会记录 response.fileId
async function doUpload({ file, onSuccess, onError }) {
  try {
    const data = await uploadImage(file)
    file.fileId = data?.fileId
    onSuccess(data)
  } catch (error) {
    onError(error)
  }
}

// 点击卡片预览大图
function handlePreview(file) {
  previewUrl.value = file.response?.url || file.url || ''
  previewVisible.value = true
}

// 从上传列表收集已成功上传的文件 ID
const collectFileIds = (fileList) =>
  fileList
    .map((f) => f.response?.fileId || f.response?.data?.fileId || f.raw?.fileId)
    .filter(Boolean)

function hasUploading(fileList) {
  return fileList.some((f) => f.status === 'uploading')
}

// 录入表单校验（与 4.2.1 必填项一致）
// 数字字段必须声明 type: 'number'，否则 async-validator 默认按 string 校验，
// 填写后反而会失败，validate() 抛错导致不会发出 POST /tools
const createRules = {
  toolName: [{ required: true, message: '请输入工具名称', trigger: 'blur' }],
  modelSpec: [{ required: true, message: '请输入型号规格', trigger: 'blur' }],
  category: [{ required: true, message: '请选择工具类别', trigger: 'change' }],
  initialDamageLevel: [
    { required: true, type: 'number', message: '请选择初始损坏程度', trigger: 'change' }
  ],
  depositAmount: [
    { required: true, type: 'number', message: '请输入押金金额', trigger: 'blur' },
    {
      type: 'number',
      min: 0.01,
      message: '押金金额须大于 0',
      trigger: 'blur'
    }
  ],
  storageLocation: [{ required: true, message: '请输入存放区域', trigger: 'blur' }],
  usageText: [{ required: true, message: '请填写使用说明', trigger: 'blur' }],
  usageImageIds: [
    {
      validator: (_rule, _value, callback) => {
        if (hasUploading(usageImageList.value)) {
          callback(new Error('图片正在上传，请稍候'))
        } else if (!collectFileIds(usageImageList.value).length) {
          callback(new Error('请上传使用说明示意图'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  toolImageIds: [
    {
      required: true,
      validator: (_rule, _value, callback) => {
        if (hasUploading(toolImageList.value)) {
          callback(new Error('图片正在上传，请稍候'))
        } else if (!collectFileIds(toolImageList.value).length) {
          callback(new Error('请上传工具实物图片'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 采购日期只能选今天及之前（不可选未来日期）
function disabledPurchaseDate(time) {
  return time.getTime() > Date.now()
}

// 打开录入弹窗：destroy-on-close 会销毁表单组件，这里同步清空数据
function openCreate() {
  Object.assign(createForm, emptyCreateForm())
  usageImageList.value = []
  toolImageList.value = []
  createVisible.value = true
}

// 提交录入（POST /tools）：先校验表单，再提交
async function handleCreateSubmit() {
  const form = createFormRef.value
  if (!form) {
    ElMessage.error('表单未就绪，请稍后重试')
    return
  }

  try {
    await form.validate()
  } catch {
    ElMessage.warning('请完善必填信息后再提交')
    return
  }

  const usageIds = collectFileIds(usageImageList.value)
  const toolIds = collectFileIds(toolImageList.value)

  submitting.value = true
  try {
    const data = await createTool({
      toolName: createForm.toolName.trim(),
      modelSpec: createForm.modelSpec.trim(),
      category: createForm.category,
      initialDamageLevel: createForm.initialDamageLevel,
      depositAmount: createForm.depositAmount,
      storageLocation: createForm.storageLocation.trim(),
      usageInstructions: {
        text: createForm.usageText.trim(),
        imageIds: usageIds
      },
      imageIds: toolIds,
      purchaseDate: createForm.purchaseDate || undefined,
      supplierInfo: createForm.supplierInfo.trim() || undefined
    })
    createVisible.value = false
    ElMessage.success(`工具录入成功，编码 ${data.toolCode}，已进入待审核状态`)
    query.page = 1
    fetchList()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.tools-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.filter-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
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

// 录入弹窗
.tool-create-dialog {
  max-width: 92vw;

  .select-input {
    width: 260px;
  }

  .field-tip {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1.6;
    margin-top: var(--space-xs);
    width: 100%;

    &.warning {
      color: var(--color-warning, #e6a23c);
    }
  }
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
