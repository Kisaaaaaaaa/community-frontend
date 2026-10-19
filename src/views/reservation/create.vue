<template>
  <div class="reservation-create-page">
    <!-- 工具摘要 -->
    <div class="card-box tool-summary">
      <div class="tool-summary__main">
        <div class="tool-summary__icon">
          <el-icon :size="26"><Box /></el-icon>
        </div>
        <div>
          <div class="tool-summary__name">{{ toolName || '工具预约' }}</div>
          <div class="tool-summary__code">{{ toolCode }}</div>
        </div>
      </div>
      <div class="tool-summary__deposit">
        <span class="label">押金</span>
        <span class="value">¥{{ formatAmount(depositAmount) }}</span>
      </div>
    </div>

    <!-- 步骤一：选择租赁时段（4.3.1） -->
    <div class="card-box step-card">
      <div class="step-head">
        <span class="step-index">1</span>
        <span class="step-title">选择租赁时段</span>
        <el-button
          text
          type="primary"
          :loading="slotsLoading"
          class="refresh-btn"
          @click="fetchSlots"
        >
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>

      <div v-loading="slotsLoading" class="slot-area">
        <div v-for="d in dates" :key="d.date" class="date-block">
          <div class="date-head">
            <span class="date-text">{{ d.date }}</span>
            <span class="date-week">{{ weekday(d.date) }}</span>
          </div>
          <div class="slot-grid">
            <button
              v-for="s in d.slots"
              :key="s.startTime"
              type="button"
              class="slot-btn"
              :class="{
                'is-occupied': !s.available,
                'is-selected': isSelected(s)
              }"
              :disabled="!s.available"
              @click="selectSlot(s)"
            >
              <span class="slot-time">{{ timeOnly(s.startTime) }} - {{ timeOnly(s.endTime) }}</span>
              <span class="slot-tag">{{ s.available ? '可预约' : '已占用' }}</span>
            </button>
          </div>
        </div>

        <el-empty v-if="!slotsLoading && !dates.length" description="该工具暂无开放的可预约时段" />
      </div>
    </div>

    <!-- 步骤二：填写取件人信息 -->
    <div class="card-box step-card">
      <div class="step-head">
        <span class="step-index">2</span>
        <span class="step-title">填写取件信息</span>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" @submit.prevent>
        <el-form-item label="取件人" prop="pickerName">
          <el-input v-model="form.pickerName" maxlength="30" placeholder="默认为租赁人本人，可填写代取人" />
        </el-form-item>
        <el-form-item label="取件人电话" prop="pickerPhone">
          <el-input v-model="form.pickerPhone" maxlength="11" placeholder="代取人时必填" />
          <div class="field-tip">取件人为本人时可留空；填写代取人时须提供联系方式</div>
        </el-form-item>
      </el-form>
    </div>

    <!-- 提交栏 -->
    <div class="card-box submit-bar">
      <div class="submit-bar__info">
        <template v-if="selected.startTime">
          <span class="label">已选时段</span>
          <span class="value">{{ selected.startTime }} ~ {{ selected.endTime }}</span>
        </template>
        <span v-else class="tip">请先在上方选择一个可预约时段</span>
      </div>
      <div class="submit-bar__actions">
        <el-button class="btn-accessible" @click="goBack">返回</el-button>
        <el-button
          type="primary"
          class="btn-accessible"
          :loading="submitting"
          :disabled="!selected.startTime"
          @click="handleSubmit"
        >
          提交预约
        </el-button>
      </div>
    </div>

    <!-- 押金缴纳弹窗（4.3.4） -->
    <DepositPayDialog
      v-model="pay.visible"
      :order-no="pay.orderNo"
      :deposit-amount="pay.depositAmount"
      :pay-bill-no="pay.payBillNo"
      :pay-deadline="pay.payDeadline"
      @paid="onPaid"
    />

    <!-- 15 分钟缴费截止提示 -->
    <el-dialog
      v-model="deadlineVisible"
      title="预约已创建"
      width="420px"
      :close-on-click-modal="false"
      @closed="onDeadlineClosed"
    >
      <el-result icon="warning" title="预约已创建，待缴纳押金">
        <template #sub-title>
          <p>预约单号：{{ created.orderNo }}</p>
          <p>请在 <b class="deadline-text">{{ created.payDeadline }}</b> 前完成押金缴纳，否则预约将自动释放。</p>
        </template>
      </el-result>
      <template #footer>
        <el-button @click="deadlineVisible = false">稍后缴纳</el-button>
        <el-button type="primary" @click="openPayFromCreated">立即缴纳押金</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Box, Refresh } from '@element-plus/icons-vue'
import {
  checkAvailability,
  createReservation,
  getAvailableSlots
} from '@/api/reservation'
import DepositPayDialog from '@/components/reservation/DepositPayDialog.vue'
import { useUserStore } from '@/store/user'
import { formatAmount } from '@/utils/reservation'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const toolCode = computed(() => String(route.query.toolCode || ''))
const toolName = computed(() => String(route.query.toolName || ''))
const depositAmount = computed(() => route.query.depositAmount || 0)

const slotsLoading = ref(false)
const dates = ref([])
const selected = reactive({ startTime: '', endTime: '' })

const formRef = ref()
const submitting = ref(false)
const form = reactive({
  pickerName: userStore.realName || '',
  pickerPhone: ''
})

const rules = {
  pickerName: [{ required: true, message: '请填写取件人姓名', trigger: 'blur' }],
  pickerPhone: [
    {
      validator: (rule, value, callback) => {
        const v = String(value || '').trim()
        if (!v) return callback()
        if (!/^1[3-9]\d{9}$/.test(v)) return callback(new Error('请输入正确的 11 位手机号'))
        return callback()
      },
      trigger: 'blur'
    }
  ]
}

// 押金缴纳弹窗状态
const pay = reactive({
  visible: false,
  orderNo: '',
  depositAmount: 0,
  payBillNo: '',
  payDeadline: ''
})

// 缴费截止提示弹窗
const deadlineVisible = ref(false)
const created = reactive({ orderNo: '', payDeadline: '', depositAmount: 0, payBillNo: '' })

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function timeOnly(datetime) {
  return String(datetime || '').split(' ')[1] || datetime || ''
}

function weekday(dateStr) {
  const d = new Date(String(dateStr).replace(/-/g, '/'))
  return Number.isNaN(d.getDay()) ? '' : WEEK[d.getDay()]
}

function isSelected(slot) {
  return selected.startTime === slot.startTime && selected.endTime === slot.endTime
}

function selectSlot(slot) {
  selected.startTime = slot.startTime
  selected.endTime = slot.endTime
}

// 4.3.1 查询工具可预约时段（默认当天起 14 天）
async function fetchSlots() {
  if (!toolCode.value) {
    ElMessage.error('缺少工具编码，无法预约')
    return
  }
  slotsLoading.value = true
  try {
    const data = await getAvailableSlots(toolCode.value, { days: 14 })
    dates.value = data?.dates || []
  } finally {
    slotsLoading.value = false
  }
}

// 4.3.2 冲突校验 → 4.3.3 创建预约 → 引导缴费
async function handleSubmit() {
  await formRef.value.validate()
  if (!selected.startTime) {
    ElMessage.warning('请先选择租赁时段')
    return
  }

  submitting.value = true
  try {
    // 先做时段冲突校验（实时）
    const check = await checkAvailability({
      toolCode: toolCode.value,
      startTime: selected.startTime,
      endTime: selected.endTime
    })

    if (!check?.available) {
      // 冲突：提示冲突明细与推荐时段
      const first = check?.suggestedSlots?.[0]
      ElMessage.warning('该时段已被预约，请重新选择')
      if (first) {
        selected.startTime = first.startTime
        selected.endTime = first.endTime
        ElMessage.info(`已为你选择系统推荐的最近时段：${first.startTime} ~ ${first.endTime}`)
      }
      await fetchSlots()
      return
    }

    // 创建预约（此时生成押金缴纳单，状态 WAIT_PAY）
    const data = await createReservation({
      toolCode: toolCode.value,
      startTime: selected.startTime,
      endTime: selected.endTime,
      pickerName: form.pickerName.trim(),
      pickerPhone: form.pickerPhone.trim() || undefined
    })

    Object.assign(created, {
      orderNo: data?.orderNo || '',
      payDeadline: data?.payDeadline || '',
      depositAmount: data?.depositAmount || depositAmount.value,
      payBillNo: data?.payBillNo || ''
    })
    deadlineVisible.value = true
  } catch {
    // 业务错误（41002 / 42001 / 42003）已由请求拦截器统一提示
  } finally {
    submitting.value = false
  }
}

function openPayFromCreated() {
  deadlineVisible.value = false
  Object.assign(pay, {
    visible: true,
    orderNo: created.orderNo,
    depositAmount: created.depositAmount,
    payBillNo: created.payBillNo,
    payDeadline: created.payDeadline
  })
}

// 用户放弃缴费：跳转到我的预约，可稍后继续缴费
function onDeadlineClosed() {
  if (!pay.visible && created.orderNo) {
    router.replace('/reservations')
  }
}

function onPaid() {
  ElMessage.success('预约已生效')
  router.replace('/reservations')
}

function goBack() {
  router.back()
}

onMounted(fetchSlots)
</script>

<style lang="scss" scoped>
.reservation-create-page {
  display: grid;
  gap: var(--space-md);
}

/* ---------- 工具摘要 ---------- */
.tool-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;

  &__main {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    min-width: 0;
  }

  &__icon {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: linear-gradient(135deg, var(--color-primary), #79bbff);
    flex-shrink: 0;
  }

  &__name {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__code {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-family: ui-monospace, Menlo, Consolas, monospace;
  }

  &__deposit {
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    .label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .value {
      font-size: 22px;
      font-weight: 700;
      color: var(--color-primary);
    }
  }
}

/* ---------- 步骤卡片 ---------- */
.step-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.step-head {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.step-index {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.refresh-btn {
  margin-left: auto;
}

/* ---------- 可预约时段 ---------- */
.slot-area {
  display: grid;
  gap: var(--space-md);
}

.date-block {
  .date-head {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);

    .date-text {
      font-weight: 600;
      color: var(--text-primary);
    }

    .date-week {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-sm);
}

.slot-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-base);
  background: var(--card-bg-color);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;

  .slot-time {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-primary);
  }

  .slot-tag {
    font-size: var(--font-size-xs);
    color: var(--color-success);
  }

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    box-shadow: 0 2px 10px rgba(64, 158, 255, 0.2);
  }

  &.is-occupied {
    background: #f5f7fa;
    cursor: not-allowed;

    .slot-time,
    .slot-tag {
      color: var(--text-placeholder);
    }

    .slot-tag {
      color: var(--text-secondary);
    }
  }

  &.is-selected {
    border-color: var(--color-primary);
    background: rgba(64, 158, 255, 0.1);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.25);

    .slot-tag {
      color: var(--color-primary);
    }
  }
}

/* ---------- 提交栏 ---------- */
.submit-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
  position: sticky;
  bottom: 0;

  &__info {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);

    .label {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .value {
      font-weight: 600;
      color: var(--text-primary);
    }

    .tip {
      color: var(--text-secondary);
    }
  }

  &__actions {
    display: flex;
    gap: var(--space-sm);
  }
}

.field-tip {
  margin-top: 4px;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: 1.5;
}

.deadline-text {
  color: var(--color-danger);
}

@media (max-width: 768px) {
  .slot-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .submit-bar {
    &__actions {
      width: 100%;

      .el-button {
        flex: 1;
      }
    }
  }
}
</style>
