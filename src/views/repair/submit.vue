<template>
  <div class="repair-submit-page">
    <!-- 顶部横幅 -->
    <div class="page-hero">
      <el-button text class="hero-back" :icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <div class="hero-body">
        <h1>提交损坏报修</h1>
        <p>请先选择一个已归还的租赁记录，损坏的工具将自动关联到报修单</p>
      </div>
    </div>

    <!-- 选择租赁记录 -->
    <div class="card-box picker-card">
      <div class="picker-header">
        <h3 class="picker-title">选择租赁记录</h3>
        <div class="picker-toggle">
          <span class="toggle-label">手动输入</span>
          <el-switch v-model="manualMode" size="default" />
        </div>
      </div>

      <!-- 记录列表 -->
      <div v-if="!manualMode" class="record-picker">
        <el-skeleton
          v-if="loadingRecords"
          :rows="3"
          animated
        />
        <div
          v-else-if="records.length === 0"
          class="picker-empty"
        >
          <el-icon :size="40" class="empty-icon"><Warning /></el-icon>
          <p>暂无已归还的租赁记录</p>
          <p class="empty-sub">报修仅支持已归还的工具，您可以先去"我的租赁"查看记录</p>
        </div>
        <div v-else class="record-grid">
          <div
            v-for="rec in records"
            :key="rec.orderNo"
            class="record-item"
            :class="{ selected: selectedOrderNo === rec.orderNo }"
            @click="selectRecord(rec)"
          >
            <div class="record-main">
              <div class="record-tool-name">{{ rec.toolName || '-' }}</div>
              <div class="record-tool-code">{{ rec.toolCode }}</div>
            </div>
            <div class="record-meta">
              <span class="record-return">
                <el-icon><Clock /></el-icon>
                归还于 {{ rec.actualReturnTime || rec.endTime || '-' }}
              </span>
              <span class="record-order-no">单号 {{ rec.orderNo }}</span>
            </div>
            <div v-if="selectedOrderNo === rec.orderNo" class="record-check">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 手动输入模式的提示 -->
      <div v-else class="manual-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>手动输入模式，请填写下方两个编号；若有疑问请切换回"从租赁记录选择"</span>
      </div>
    </div>

    <!-- 报修详情表单 -->
    <div class="card-box form-card">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="110px"
        label-position="right"
        class="submit-form"
      >
        <!-- 自动带出的只读展示 -->
        <el-form-item v-if="!manualMode && selectedRecord" label="已选工具">
          <div class="auto-fill-display">
            <span class="auto-name">{{ selectedRecord.toolName }}</span>
            <el-tag size="small" type="info">{{ selectedRecord.toolCode }}</el-tag>
            <el-tag size="small" type="success" v-if="selectedRecord.actualReturnTime">
              {{ selectedRecord.actualReturnTime }} 归还
            </el-tag>
          </div>
        </el-form-item>

        <!-- 手动输入的 orderNo / toolCode -->
        <el-form-item label="预约单号" prop="orderNo">
          <el-input
            v-if="manualMode"
            v-model="form.orderNo"
            placeholder="请输入租赁预约单号（如 YU-G-20261001-0001）"
            maxlength="32"
            clearable
          />
          <el-input
            v-else
            v-model="form.orderNo"
            disabled
            placeholder="选择记录后自动填入"
          >
            <template #prepend>自动</template>
          </el-input>
          <div class="field-tip">仅已归还的租赁记录可提交报修</div>
        </el-form-item>

        <el-form-item label="工具编号" prop="toolCode">
          <el-input
            v-if="manualMode"
            v-model="form.toolCode"
            placeholder="请输入工具编号（如 SQ-G-WX-0001）"
            maxlength="30"
            clearable
          />
          <el-input
            v-else
            v-model="form.toolCode"
            disabled
            placeholder="选择记录后自动填入"
          >
            <template #prepend>自动</template>
          </el-input>
        </el-form-item>

        <el-form-item label="损坏部位" prop="damagePart">
          <el-input
            v-model="form.damagePart"
            placeholder="请简要描述损坏部位，如「钻头夹头」「电源线」"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="损坏描述" prop="damageDescription">
          <el-input
            v-model="form.damageDescription"
            type="textarea"
            :rows="5"
            placeholder="请详细描述损坏现象、使用场景等，便于工作人员核验和维修"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item class="submit-actions">
          <el-button @click="$router.back()">取消</el-button>
          <el-button
            v-if="!manualMode && !selectedOrderNo"
            type="primary"
            round
            disabled
          >请先选择租赁记录</el-button>
          <el-button
            v-else
            type="primary"
            round
            :loading="submitting"
            @click="handleSubmit"
          >提交报修</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Warning, Clock, CircleCheckFilled, InfoFilled } from '@element-plus/icons-vue'
import { submitRepair } from '@/api/repair'
import { getMyRecords } from '@/api/rentrecord'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const submitting = ref(false)
const loadingRecords = ref(false)
const records = ref([])
const selectedOrderNo = ref('')
const manualMode = ref(false)

const selectedRecord = computed(() =>
  records.value.find(r => r.orderNo === selectedOrderNo.value) || null
)

const form = reactive({
  orderNo: '',
  toolCode: '',
  damagePart: '',
  damageDescription: ''
})

const rules = {
  orderNo: [
    { required: true, message: '请填写预约单号', trigger: 'blur' },
    { min: 4, message: '预约单号格式不正确', trigger: 'blur' }
  ],
  toolCode: [
    { required: true, message: '请填写工具编号', trigger: 'blur' },
    { min: 4, message: '工具编号格式不正确', trigger: 'blur' }
  ],
  damagePart: [
    { required: true, message: '请填写损坏部位', trigger: 'blur' },
    { min: 2, message: '损坏部位至少 2 个字', trigger: 'blur' }
  ],
  damageDescription: [
    { required: true, message: '请填写损坏描述', trigger: 'blur' },
    { min: 10, message: '损坏描述至少 10 个字，便于核验', trigger: 'blur' }
  ]
}

async function loadRecords() {
  if (userStore.role !== 'RESIDENT') return
  loadingRecords.value = true
  try {
    const d = await getMyRecords({ status: 'RETURNED', pageSize: 50, page: 1 })
    records.value = d?.list || []
  } catch (e) {
    ElMessage.warning('获取租赁记录失败，可切换手动输入')
    records.value = []
  } finally {
    loadingRecords.value = false
  }
}

function selectRecord(rec) {
  selectedOrderNo.value = rec.orderNo
  form.orderNo = rec.orderNo
  form.toolCode = rec.toolCode
  // 重置表单校验（避免之前的错误提示残留）
  setTimeout(() => formRef.value?.clearValidate(['orderNo', 'toolCode']), 0)
}

function clearSelection() {
  selectedOrderNo.value = ''
  form.orderNo = ''
  form.toolCode = ''
}

// 切到手动模式时清掉自动带的值；切回来保持选中
function onManualModeChange(val) {
  if (val) clearSelection()
}
// 把 switch 的 watch 接上
import { watch } from 'vue'
watch(manualMode, onManualModeChange)

async function handleSubmit() {
  if (userStore.role !== 'RESIDENT') {
    ElMessage.warning('仅居民可提交报修')
    return
  }
  if (!manualMode.value && !selectedOrderNo.value) {
    ElMessage.warning('请先选择一条租赁记录')
    return
  }
  await formRef.value.validate()
  submitting.value = true
  try {
    const d = await submitRepair({ ...form })
    ElMessage.success(`报修提交成功，工单号 ${d?.repairNo || ''}`)
    router.replace({ name: 'RepairMy' })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (userStore.role !== 'RESIDENT') {
    ElMessage.warning('仅居民可提交报修')
    router.replace('/home')
    return
  }
  loadRecords()
})
</script>

<style lang="scss" scoped>
.repair-submit-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: var(--space-lg);
}

// ---- 顶部横幅 ----
.page-hero {
  position: relative;
  padding: var(--space-lg) var(--space-xl);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--color-primary) 0%, #7fbaff 100%);
  color: #fff;
  overflow: hidden;

  .hero-back {
    position: relative;
    z-index: 1;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: var(--space-sm);
    padding-left: 0;

    &:hover { color: #fff; text-decoration: underline; }
  }

  .hero-body { position: relative; z-index: 1; }

  h1 {
    margin: 0 0 var(--space-xs);
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.3px;
  }

  p {
    margin: 0;
    font-size: var(--font-size-sm);
    opacity: 0.9;
    line-height: 1.7;
  }

  // 装饰光斑
  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(6px);
    pointer-events: none;
  }
  &::before {
    width: 220px; height: 220px;
    background: rgba(255, 255, 255, 0.12);
    top: -80px; right: -40px;
  }
  &::after {
    width: 140px; height: 140px;
    background: rgba(255, 255, 255, 0.08);
    bottom: -50px; right: 120px;
  }
}

// ---- 选择记录卡片 ----
.picker-card { padding: var(--space-lg); }

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);

  .picker-title {
    margin: 0;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  .picker-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}

.picker-empty {
  text-align: center;
  padding: var(--space-xl) 0;
  color: var(--text-secondary);

  .empty-icon {
    color: var(--text-placeholder);
    margin-bottom: var(--space-sm);
  }

  p { margin: 0; }
  .empty-sub { font-size: var(--font-size-xs); margin-top: 4px; opacity: 0.7; }
}

.record-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.record-item {
  position: relative;
  padding: 14px 16px;
  border: 1px solid var(--border-lighter);
  border-radius: var(--radius-md);
  background: var(--card-bg-color);
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
  }

  &.selected {
    border-color: var(--color-primary);
    background: rgba(64, 158, 255, 0.06);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
  }
}

.record-main { margin-bottom: 8px; }

.record-tool-name {
  font-weight: 600;
  font-size: var(--font-size-base);
  color: var(--text-primary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-tool-code {
  font-family: 'Consolas', 'Menlo', monospace;
  font-size: 12px;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
}

.record-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);

  .record-return,
  .record-order-no {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

.record-check {
  position: absolute;
  top: 10px;
  right: 12px;
  color: var(--color-primary);
  font-size: 18px;
}

.manual-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  background: rgba(230, 243, 255, 0.6);
  border: 1px solid rgba(64, 158, 255, 0.2);
  color: var(--text-regular);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

// ---- 表单卡片 ----
.form-card { padding: var(--space-xl) var(--space-xl); }

.submit-form {
  max-width: none;
}

.auto-fill-display {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  .auto-name {
    font-weight: 600;
    font-size: var(--font-size-base);
    color: var(--text-primary);
  }
}

.submit-actions {
  margin-top: var(--space-md);

  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
}

.field-tip {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 4px;
}
</style>
