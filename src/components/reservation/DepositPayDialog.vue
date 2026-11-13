<template>
  <el-dialog
    :model-value="modelValue"
    title="缴纳押金"
    width="480px"
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @closed="reset"
  >
    <div v-loading="submitting" class="pay-panel">
      <!-- 金额展示 -->
      <div class="pay-amount">
        <span class="pay-amount__label">应缴押金</span>
        <span class="pay-amount__value">¥{{ formatAmount(depositAmount) }}</span>
      </div>

      <!-- 已过缴费截止：与后端 is_pay_expired 一致，禁止继续缴费 -->
      <el-alert
        v-if="deadlinePassed"
        type="error"
        :closable="false"
        show-icon
        title="缴费已超时，该预约已释放，无法缴费，请重新预约"
        class="pay-expired"
      />

      <!-- 预约信息 -->
      <el-descriptions :column="1" border size="large" class="pay-desc">
        <el-descriptions-item label="预约单号">{{ orderNo }}</el-descriptions-item>
        <el-descriptions-item v-if="payBillNo" label="缴费单号">{{ payBillNo }}</el-descriptions-item>
        <el-descriptions-item v-if="payDeadline" label="缴费截止">
          <span class="pay-deadline">{{ payDeadline }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 支付渠道（仅展示，押金统一走支付宝沙箱） -->
      <div v-if="step === 'choose'" class="pay-channel">
        <span class="pay-channel__label">支付渠道</span>
        <div class="pay-channel__value">
          <el-tag type="primary" effect="plain" round>支付宝沙箱</el-tag>
        </div>
        <div class="pay-channel-tip">
          <el-icon><InfoFilled /></el-icon>
          提交后请用手机支付宝扫码（或在本机打开收银台）完成支付，支付完成后返回本页确认状态
        </div>
      </div>

      <!-- 等待支付 -->
      <div v-if="step === 'waiting'" class="pay-waiting">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="请在弹出的二维码窗口完成支付，本页会自动对账"
        >
          <template #default>
            <div class="waiting-meta">
              <span>支付单号：<b>{{ payNo }}</b></span>
              <span>金额：<b>¥{{ formatAmount(depositAmount) }}</b></span>
              <span v-if="expireTime" class="expire">二维码有效期至 {{ expireTime }}，过期请重新下单</span>
            </div>
          </template>
        </el-alert>

        <div class="pay-actions">
          <el-button round :icon="Grid" @click="qrVisible = true">重新显示二维码</el-button>
          <el-button round :icon="CopyDocument" @click="copyPayUrl">复制支付链接</el-button>
          <el-button round :icon="Open" @click="openPayWindow">本机打开收银台</el-button>
          <el-button type="primary" round :icon="Refresh" :loading="polling" @click="checkAndRefresh">
            {{ polling ? '查询中…' : '我已完成支付，立即刷新' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 大尺寸二维码弹窗：收银台链接约 1000 字符，小图无法识别 -->
    <PayQrDialog
      v-model="qrVisible"
      :pay-url="payUrl"
      :pay-no="payNo"
      :amount="formatAmount(depositAmount)"
      :expire-time="expireTime"
    />

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">稍后缴纳</el-button>
      <el-button
        v-if="step === 'choose'"
        type="primary"
        :loading="submitting"
        :disabled="deadlinePassed"
        @click="handlePay"
      >
        确认缴纳
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, Open, Refresh, CopyDocument, Grid } from '@element-plus/icons-vue'
import { payDeposit, getDepositStatus } from '@/api/reservation'
import { formatAmount } from '@/utils/reservation'
import { usePaymentCountdown } from '@/composables/usePaymentCountdown'
import PayQrDialog from '@/components/payment/PayQrDialog.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  orderNo: { type: String, default: '' },
  depositAmount: { type: [Number, String], default: 0 },
  payBillNo: { type: String, default: '' },
  payDeadline: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'paid'])

const step = ref('choose') // choose | waiting
const submitting = ref(false)
const polling = ref(false)
const qrVisible = ref(false)

const payNo = ref('')
const payUrl = ref('')
const expireTime = ref('')

// 缴费截止已过（借用倒计时心跳，弹窗停留期间到点后自动失效）
const { deadlineClass } = usePaymentCountdown()
const deadlinePassed = computed(() => deadlineClass(props.payDeadline) === 'is-overdue')

let pollTimer = null

function reset() {
  stopPolling()
  step.value = 'choose'
  submitting.value = false
  polling.value = false
  qrVisible.value = false
  payNo.value = ''
  payUrl.value = ''
  expireTime.value = ''
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function openPayWindow() {
  if (!payUrl.value) return
  window.open(payUrl.value, '_blank', 'noopener,noreferrer,width=1200,height=800')
}

async function copyPayUrl() {
  if (!payUrl.value) return
  try {
    await navigator.clipboard.writeText(payUrl.value)
    ElMessage.success('支付链接已复制到剪贴板，请在新浏览器标签页打开')
  } catch {
    ElMessage.error('复制失败，请手动选择复制下方链接')
  }
}

async function handlePay() {
  if (deadlinePassed.value) {
    ElMessage.warning('缴费已超时，该预约已释放，无法缴费')
    return
  }
  submitting.value = true
  try {
    const data = await payDeposit(props.orderNo, { payChannel: 'ALIPAY' })

    payNo.value = data.payNo || ''
    payUrl.value = data.payUrl || ''
    expireTime.value = data.expireTime || ''

    step.value = 'waiting'
    // 下单成功后直接弹出大尺寸二维码，避免小图扫不出来
    qrVisible.value = true
    // 后台每 3 秒查询一次（sync=true，后端会向渠道主动对账）
    startPolling()
  } finally {
    submitting.value = false
  }
}

function startPolling() {
  stopPolling()
  pollTimer = setInterval(checkAndRefresh, 3000)
}

// 解析后端返回的 yyyy-MM-dd HH:mm（本地时区）
function isExpired(text) {
  if (!text) return false
  const ts = new Date(String(text).replace(/-/g, '/')).getTime()
  return Number.isFinite(ts) && Date.now() > ts
}

async function checkAndRefresh() {
  polling.value = true
  try {
    const data = await getDepositStatus(props.orderNo, true)
    const payment = data?.payment || null

    if (data && (data.depositStatus === 'PAID' || data.reservationStatus === 'CONFIRMED')) {
      stopPolling()
      ElMessage.success('押金缴纳成功，预约已生效')
      emit('update:modelValue', false)
      emit('paid')
      return
    }
    // 只有支付单被关闭/失败，或已过有效期，才提示重新下单；
    // 未支付时 depositStatus 一直是 UNPAID，不能据此判定失效
    if (payment && (payment.status === 'CLOSED' || payment.status === 'FAILED')) {
      stopPolling()
      ElMessage.warning('支付单已关闭，请重新下单')
      step.value = 'choose'
      return
    }
    if (payment && payment.status === 'PENDING' && isExpired(payment.expireTime)) {
      stopPolling()
      ElMessage.warning('支付二维码已过期，请重新下单')
      step.value = 'choose'
    }
  } catch (e) {
    // 拦截器已提示，静默忽略
  } finally {
    polling.value = false
  }
}

onBeforeUnmount(stopPolling)
</script>

<style lang="scss" scoped>
.pay-panel {
  min-height: 200px;
}

.pay-expired {
  margin-bottom: var(--space-md);
}

.pay-amount {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-lg) 0;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(64, 158, 255, 0.02));
  border-radius: var(--radius-md);
  margin-bottom: var(--space-md);

  &__label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  &__value {
    font-size: 32px;
    font-weight: 700;
    color: var(--color-primary);
    line-height: 1;
  }
}

.pay-desc {
  margin-bottom: var(--space-md);

  :deep(.el-descriptions__label) {
    width: 96px;
    color: var(--text-secondary);
  }
}

.pay-deadline {
  color: var(--color-danger);
  font-weight: 600;
}

.pay-channel {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);

  &__label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}

.pay-channel-tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background-color: rgba(64, 158, 255, 0.08);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  line-height: 1.6;
}

.pay-waiting {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-top: var(--space-sm);

  :deep(.el-alert__content) {
    width: 100%;
  }
}

.waiting-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);

  b {
    color: var(--text-primary);
  }

  .expire {
    color: var(--color-danger);
    margin-top: 4px;
  }
}

.pay-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  flex-wrap: wrap;
}
</style>
