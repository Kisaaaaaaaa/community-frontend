<template>
  <div v-loading="loading" class="reservation-detail-page">
    <div v-if="reservation" class="detail-wrap">
      <!-- 状态主视觉 -->
      <div class="hero" :class="heroClass">
        <div class="hero__top">
          <el-tag class="hero__status" effect="dark" round>
            {{ reservationStatusLabel(reservation.status) }}
          </el-tag>
          <div
            v-if="isWaitPay && reservation.payDeadline"
            class="hero__countdown"
            :class="{ 'is-urgent': isUrgent }"
          >
            <el-icon><Timer /></el-icon>
            <span>{{ payCountdown(reservation.payDeadline) }}</span>
          </div>
        </div>

        <div class="hero__main">
          <div class="hero__left">
            <div class="hero__name">{{ reservation.toolName || '工具' }}</div>
            <div class="hero__code">
              <el-icon><Box /></el-icon>
              <span>{{ reservation.toolCode || '-' }}</span>
            </div>
            <div class="hero__order">
              <span class="label">预约单号</span>
              <span class="value">{{ reservation.orderNo }}</span>
              <el-icon class="copy" title="复制单号" @click="copyOrderNo"><CopyDocument /></el-icon>
            </div>
          </div>

          <div class="hero__amount">
            <span class="label">押金</span>
            <span class="value">¥{{ formatAmount(reservation.depositAmount) }}</span>
            <span class="sub">{{ depositStatusLabel(reservation.depositStatus) }}</span>
          </div>
        </div>
      </div>

      <!-- 流转进度 -->
      <div v-if="showSteps" class="card-box steps-card">
        <el-steps :active="activeStep" align-center finish-status="success" process-status="finish">
          <el-step title="提交预约" />
          <el-step title="缴纳押金" />
          <el-step title="取件使用" />
          <el-step title="归还完成" />
        </el-steps>
      </div>
      <div v-else class="card-box state-card">
        <el-icon class="state-card__icon"><CircleClose /></el-icon>
        <span>
          {{ reservation.status === 'CANCELLED'
            ? '该预约已取消，押金将全额退还'
            : '该预约已逾期，请尽快归还或联系社区处理' }}
        </span>
      </div>

      <!-- 信息卡：对称两列 -->
      <div class="info-grid">
        <div v-for="group in infoGroups" :key="group.title" class="card-box info-card">
          <h4 class="section-title">
            <span class="section-title__icon">
              <el-icon><component :is="group.icon" /></el-icon>
            </span>
            {{ group.title }}
          </h4>
          <div class="kv-list">
            <div v-for="row in group.items" :key="row.label" class="kv-item">
              <span class="kv-label">{{ row.label }}</span>
              <span class="kv-value">{{ row.value || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 押金与退还 -->
      <div class="card-box info-card">
        <h4 class="section-title">
          <span class="section-title__icon">
            <el-icon><Money /></el-icon>
          </span>
          押金与退还
        </h4>
        <div class="kv-list kv-list--inline">
          <div class="kv-item">
            <span class="kv-label">押金金额</span>
            <span class="kv-value is-price">¥{{ formatAmount(reservation.depositAmount) }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-label">押金状态</span>
            <span class="kv-value">
              <el-tag size="small" :type="depositTagType" effect="light">
                {{ depositStatusLabel(reservation.depositStatus) }}
              </el-tag>
            </span>
          </div>
          <div v-if="refundInfo" class="kv-item">
            <span class="kv-label">退还金额</span>
            <span class="kv-value is-price">¥{{ formatAmount(refundInfo.refundAmount) }}</span>
          </div>
          <div v-if="refundInfo" class="kv-item">
            <span class="kv-label">退还状态</span>
            <span class="kv-value">{{ refundStatusLabel(refundInfo.refundStatus) }}</span>
          </div>
          <div v-if="refundInfo" class="kv-item">
            <span class="kv-label">退还时间</span>
            <span class="kv-value">{{ refundInfo.refundTime || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 操作栏 -->
      <div class="card-box action-bar">
        <el-button class="btn-accessible" @click="goBack">返回</el-button>
        <el-button v-if="canPay" type="primary" class="btn-accessible" @click="openPay">
          立即缴费
        </el-button>
        <el-button
          v-if="canCancelStatus"
          type="danger"
          plain
          class="btn-accessible"
          @click="handleCancel"
        >
          取消预约
        </el-button>
      </div>
    </div>

    <el-empty v-else-if="!loading" description="预约单不存在">
      <el-button type="primary" @click="goBack">返回</el-button>
    </el-empty>

    <!-- 押金缴纳弹窗 -->
    <DepositPayDialog
      v-model="pay.visible"
      :order-no="pay.orderNo"
      :deposit-amount="pay.depositAmount"
      :pay-deadline="pay.payDeadline"
      @paid="loadDetail"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Box,
  CircleClose,
  Clock,
  CopyDocument,
  Money,
  Timer,
  User
} from '@element-plus/icons-vue'
import { cancelReservation, getReservationDetail } from '@/api/reservation'
import DepositPayDialog from '@/components/reservation/DepositPayDialog.vue'
import { usePaymentCountdown } from '@/composables/usePaymentCountdown'
import { useUserStore } from '@/store/user'
import {
  canCancel,
  depositStatusLabel,
  formatAmount,
  refundStatusLabel,
  reservationStatusLabel
} from '@/utils/reservation'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const orderNo = computed(() => String(route.params.orderNo || ''))

const loading = ref(false)
const reservation = ref(null)
const refundInfo = ref(null)

const { payCountdown, deadlineClass } = usePaymentCountdown()

const isWaitPay = computed(() => reservation.value?.status === 'WAIT_PAY')
// 押金缴纳仅居民本人可操作（4.3.4 权限为 resident）
const canPay = computed(() => isWaitPay.value && userStore.role === 'RESIDENT')
const canCancelStatus = computed(() => canCancel(reservation.value?.status))
const isUrgent = computed(
  () => isWaitPay.value && deadlineClass(reservation.value?.payDeadline) === 'is-urgent'
)

// 主视觉渐变配色随状态变化
const heroClass = computed(() => `hero--${(reservation.value?.status || 'none').toLowerCase()}`)

// 押金状态标签色
const depositTagType = computed(() => {
  switch (reservation.value?.depositStatus) {
    case 'PAID':
      return 'success'
    case 'UNPAID':
      return 'warning'
    case 'REFUNDED':
      return 'success'
    case 'PART_REFUND':
      return 'warning'
    default:
      return 'info'
  }
})

// 流转进度（已取消 / 逾期不走进度条）
const showSteps = computed(
  () => !['CANCELLED', 'OVERDUE'].includes(reservation.value?.status)
)
const activeStep = computed(() => {
  switch (reservation.value?.status) {
    case 'WAIT_PAY':
      return 1
    case 'CONFIRMED':
      return 2
    case 'PICKED_UP':
      return 3
    case 'RETURNED':
      return 4
    default:
      return 0
  }
})

// 对称信息卡数据
const infoGroups = computed(() => {
  const r = reservation.value || {}
  return [
    {
      title: '工具与租赁人',
      icon: User,
      items: [
        { label: '工具名称', value: r.toolName },
        { label: '工具编号', value: r.toolCode },
        { label: '租赁人', value: r.renterName },
        { label: '联系方式', value: r.renterPhone },
        { label: '身份证号', value: r.renterIdCard }
      ]
    },
    {
      title: '取件与时间',
      icon: Clock,
      items: [
        { label: '取件时间', value: r.startTime },
        { label: '归还时间', value: r.endTime },
        { label: '取件人', value: r.pickerName },
        { label: '取件人电话', value: r.pickerPhone },
        { label: '创建时间', value: r.createTime }
      ]
    }
  ]
})

const pay = reactive({ visible: false, orderNo: '', depositAmount: 0, payDeadline: '' })

// 4.3.6 预约详情查询
async function loadDetail() {
  if (!orderNo.value) return
  loading.value = true
  try {
    const data = await getReservationDetail(orderNo.value)
    reservation.value = data?.reservation || null
    refundInfo.value = data?.refundInfo || null
  } finally {
    loading.value = false
  }
}

function openPay() {
  Object.assign(pay, {
    visible: true,
    orderNo: orderNo.value,
    depositAmount: reservation.value?.depositAmount || 0,
    payDeadline: reservation.value?.payDeadline || ''
  })
}

async function copyOrderNo() {
  try {
    await navigator.clipboard.writeText(reservation.value?.orderNo || '')
    ElMessage.success('预约单号已复制')
  } catch {
    ElMessage.warning('复制失败，请手动选择单号')
  }
}

// 4.3.5 取消预约
async function handleCancel() {
  let reason = ''
  try {
    const { value } = await ElMessageBox.prompt('请输入取消原因（选填）', '取消预约', {
      confirmButtonText: '确认取消',
      cancelButtonText: '我再想想',
      inputType: 'textarea',
      inputPlaceholder: '如：临时有事无法取件',
      type: 'warning'
    })
    reason = value || ''
  } catch {
    return
  }
  try {
    await cancelReservation(orderNo.value, { cancelReason: reason.trim() || undefined })
    ElMessage.success('预约已取消，押金将全额退还')
    loadDetail()
  } catch {
    // 错误由拦截器统一提示
  }
}

function goBack() {
  router.back()
}

onMounted(loadDetail)
</script>

<style lang="scss" scoped>
.reservation-detail-page {
  display: grid;
  gap: var(--space-md);
}

.detail-wrap {
  display: grid;
  gap: var(--space-md);
}

/* ---------- 状态主视觉 ---------- */
.hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg, 12px);
  padding: var(--space-lg);
  color: #fff;
  background: linear-gradient(135deg, #409eff, #79bbff);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.25);

  // 装饰光斑
  &::after {
    content: '';
    position: absolute;
    right: -50px;
    top: -60px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.14);
    pointer-events: none;
  }

  &__top {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-lg);
  }

  &__status {
    border: 1px solid rgba(255, 255, 255, 0.5) !important;
    background: rgba(255, 255, 255, 0.18) !important;
    color: #fff !important;
    font-weight: 600;
  }

  &__countdown {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: var(--font-size-sm);
    font-variant-numeric: tabular-nums;
    background: rgba(255, 255, 255, 0.2);

    &.is-urgent {
      background: rgba(255, 255, 255, 0.95);
      color: var(--color-danger);
      font-weight: 700;
      animation: pulse 1.2s ease-in-out infinite;
    }
  }

  &__main {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-md);
    flex-wrap: wrap;
  }

  &__name {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 0.6px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }

  // 工具编号：改用页面统一字体 + 胶囊底，避免等宽字体与整体风格不一致
  &__code {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 2px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    font-size: var(--font-size-sm);
    font-weight: 500;
    letter-spacing: 0.4px;
    color: #fff;
  }

  &__order {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;

    .label {
      font-size: var(--font-size-sm);
      color: rgba(255, 255, 255, 0.8);
    }

    .value {
      font-size: var(--font-size-base);
      font-weight: 600;
      letter-spacing: 0.5px;
      font-variant-numeric: tabular-nums;
      color: #fff;
    }

    .copy {
      cursor: pointer;
      color: rgba(255, 255, 255, 0.9);
      transition: color 0.2s ease;

      &:hover {
        color: #fff;
      }
    }
  }

  &__amount {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    text-align: right;

    .label {
      font-size: var(--font-size-sm);
      color: rgba(255, 255, 255, 0.8);
    }

    .value {
      font-size: 34px;
      font-weight: 800;
      line-height: 1.15;
      font-variant-numeric: tabular-nums;
    }

    .sub {
      font-size: var(--font-size-sm);
      color: rgba(255, 255, 255, 0.9);
    }
  }

  // 状态配色
  &.hero--wait_pay {
    background: linear-gradient(135deg, #e6a23c, #f3c07b);
    box-shadow: 0 8px 24px rgba(230, 162, 60, 0.28);
  }
  &.hero--confirmed {
    background: linear-gradient(135deg, #529b2e, #85ce61);
    box-shadow: 0 8px 24px rgba(103, 194, 58, 0.28);
  }
  &.hero--picked_up {
    background: linear-gradient(135deg, #337ecc, #79bbff);
  }
  &.hero--returned {
    background: linear-gradient(135deg, #73767a, #a6a9ad);
    box-shadow: 0 8px 24px rgba(144, 147, 153, 0.28);
  }
  &.hero--cancelled,
  &.hero--overdue {
    background: linear-gradient(135deg, #d9534f, #f78989);
    box-shadow: 0 8px 24px rgba(245, 108, 108, 0.28);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* ---------- 流转进度 ---------- */
.steps-card {
  padding: var(--space-lg) var(--space-md);
}

.state-card {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--color-danger);
  font-weight: 500;

  &__icon {
    font-size: 20px;
  }
}

/* ---------- 信息卡 ---------- */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

.info-card {
  .section-title {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin: 0 0 var(--space-md);
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  .section-title__icon {
    width: 26px;
    height: 26px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    background: rgba(64, 158, 255, 0.12);
  }
}

.kv-list {
  display: grid;
  gap: 0;

  &--inline {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0 var(--space-lg);
  }
}

.kv-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  border-bottom: 1px dashed var(--border-lighter);

  &:last-child {
    border-bottom: none;
  }
}

.kv-label {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.kv-value {
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  text-align: right;
  word-break: break-all;

  &.is-price {
    font-size: var(--font-size-base);
    font-weight: 700;
    color: var(--color-primary);
  }
}

/* ---------- 操作栏 ---------- */
.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .hero {
    &__name {
      font-size: 22px;
    }

    &__amount {
      align-items: flex-start;
      text-align: left;
    }
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .action-bar .el-button {
    flex: 1;
  }
}
</style>
