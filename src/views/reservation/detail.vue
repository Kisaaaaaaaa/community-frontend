<template>
  <div v-loading="loading" class="reservation-detail-page">
    <div v-if="reservation" class="detail-wrap">
      <!-- 状态横幅 -->
      <div class="card-box status-banner" :class="`status-${(reservation.status || '').toLowerCase()}`">
        <div class="status-banner__left">
          <el-tag :type="reservationStatusTag(reservation.status)" size="large" effect="dark">
            {{ reservationStatusLabel(reservation.status) }}
          </el-tag>
          <div class="status-banner__order">
            <span class="label">预约单号</span>
            <span class="value">{{ reservation.orderNo }}</span>
          </div>
        </div>
        <div class="status-banner__amount">
          <span class="label">押金</span>
          <span class="value">¥{{ formatAmount(reservation.depositAmount) }}</span>
          <el-tag size="small" type="info" effect="plain">
            {{ depositStatusLabel(reservation.depositStatus) }}
          </el-tag>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="card-box info-card">
        <h4 class="section-title">基本信息</h4>
        <el-descriptions :column="column" border>
          <el-descriptions-item label="工具名称">{{ reservation.toolName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="工具编号">{{ reservation.toolCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="租赁人">{{ reservation.renterName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ reservation.renterPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ reservation.renterIdCard || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ reservation.createTime || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 租赁信息 -->
      <div class="card-box info-card">
        <h4 class="section-title">租赁信息</h4>
        <el-descriptions :column="column" border>
          <el-descriptions-item label="取件时间">{{ reservation.startTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="归还时间">{{ reservation.endTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="取件人">{{ reservation.pickerName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="取件人电话">{{ reservation.pickerPhone || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 押金退还信息 -->
      <div v-if="refundInfo" class="card-box info-card">
        <h4 class="section-title">押金退还信息</h4>
        <el-descriptions :column="column" border>
          <el-descriptions-item label="退还金额">¥{{ formatAmount(refundInfo.refundAmount) }}</el-descriptions-item>
          <el-descriptions-item label="退还状态">{{ refundStatusLabel(refundInfo.refundStatus) }}</el-descriptions-item>
          <el-descriptions-item label="退还时间">{{ refundInfo.refundTime || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 操作栏 -->
      <div class="card-box action-bar">
        <el-button class="btn-accessible" @click="goBack">返回</el-button>
        <el-button
          v-if="canPay"
          type="primary"
          class="btn-accessible"
          @click="openPay"
        >
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
import { cancelReservation, getReservationDetail } from '@/api/reservation'
import DepositPayDialog from '@/components/reservation/DepositPayDialog.vue'
import { useAppStore } from '@/store/app'
import {
  canCancel,
  depositStatusLabel,
  formatAmount,
  refundStatusLabel,
  reservationStatusLabel,
  reservationStatusTag
} from '@/utils/reservation'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const orderNo = computed(() => String(route.params.orderNo || ''))

const loading = ref(false)
const reservation = ref(null)
const refundInfo = ref(null)

// 窄屏下描述列表单列展示
const column = computed(() => (appStore.isMobile ? 1 : 2))

const canPay = computed(() => reservation.value?.status === 'WAIT_PAY')
const canCancelStatus = computed(() => canCancel(reservation.value?.status))

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
    payDeadline: ''
  })
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

.status-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
  border-left: 4px solid var(--color-primary);

  &__left {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    flex-wrap: wrap;
  }

  &__order {
    display: flex;
    flex-direction: column;

    .label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .value {
      font-family: ui-monospace, Menlo, Consolas, monospace;
      color: var(--text-primary);
    }
  }

  &__amount {
    display: flex;
    align-items: center;
    gap: var(--space-sm);

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

  &.status-wait_pay {
    border-left-color: var(--color-warning);
  }
  &.status-cancelled,
  &.status-overdue {
    border-left-color: var(--color-danger);
  }
  &.status-returned {
    border-left-color: var(--color-info);
  }
}

.info-card {
  .section-title {
    margin: 0 0 var(--space-md);
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-primary);
    padding-left: var(--space-sm);
    border-left: 4px solid var(--color-primary);
    line-height: 1.2;
  }

  :deep(.el-descriptions__label) {
    color: var(--text-secondary);
  }
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .action-bar .el-button {
    flex: 1;
  }
}
</style>
