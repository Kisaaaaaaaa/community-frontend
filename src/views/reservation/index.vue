<template>
  <div class="my-reservation-page">
    <!-- 状态筛选 -->
    <div class="card-box filter-card">
      <div class="filter-head">
        <h3 class="page-title">我的预约</h3>
        <span class="page-sub">{{ total }} 条预约记录</span>
      </div>
      <el-radio-group v-model="query.status" class="status-filter" @change="handleSearch">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button
          v-for="item in RESERVATION_STATUS_OPTIONS"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 预约卡片列表 -->
    <div v-loading="loading" class="res-list">
      <div v-for="item in list" :key="item.orderNo" class="res-card card-box">
        <div class="res-card__head">
          <div class="res-card__title">
            <span class="tool-name" :title="item.toolName">{{ item.toolName || '工具' }}</span>
            <el-tag :type="reservationStatusTag(item.status)" effect="light" size="small">
              {{ reservationStatusLabel(item.status) }}
            </el-tag>
          </div>
          <span class="order-no">{{ item.orderNo }}</span>
        </div>

        <div class="res-card__body">
          <div class="info-item">
            <el-icon><Box /></el-icon>
            <span class="info-item__label">工具编号</span>
            <span class="info-item__value">{{ item.toolCode || '-' }}</span>
          </div>
          <div class="info-item">
            <el-icon><Clock /></el-icon>
            <span class="info-item__label">租赁时段</span>
            <span class="info-item__value">{{ item.startTime }} ~ {{ item.endTime }}</span>
          </div>
          <div class="info-item">
            <el-icon><Money /></el-icon>
            <span class="info-item__label">押金</span>
            <span class="info-item__value">
              ¥{{ formatAmount(item.depositAmount) }}
              <el-tag size="small" type="info" effect="plain">
                {{ depositStatusLabel(item.depositStatus) }}
              </el-tag>
            </span>
          </div>
          <div class="info-item">
            <el-icon><User /></el-icon>
            <span class="info-item__label">取件人</span>
            <span class="info-item__value">{{ item.pickerName || item.renterName || '-' }}</span>
          </div>
        </div>

        <!-- 待缴费：缴费截止倒计时 -->
        <div
          v-if="item.status === 'WAIT_PAY' && item.payDeadline"
          class="pay-countdown"
          :class="deadlineClass(item.payDeadline)"
        >
          <el-icon><Timer /></el-icon>
          <span>缴费截止：{{ item.payDeadline }}（{{ payCountdown(item.payDeadline) }}）</span>
        </div>

        <div class="res-card__footer">
          <el-button class="btn-accessible" @click="goDetail(item)">查看详情</el-button>
          <el-button
            v-if="item.status === 'WAIT_PAY'"
            type="primary"
            class="btn-accessible"
            @click="openPay(item)"
          >
            立即缴费
          </el-button>
          <el-button
            v-if="canCancel(item.status)"
            type="danger"
            plain
            class="btn-accessible"
            @click="openCancel(item)"
          >
            取消预约
          </el-button>
        </div>
      </div>

      <el-empty v-if="!loading && !list.length" description="暂无预约记录">
        <el-button type="primary" @click="goTools">去看看工具</el-button>
      </el-empty>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination-bar">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="fetchList"
      />
    </div>

    <!-- 押金缴纳弹窗（4.3.4） -->
    <DepositPayDialog
      v-model="pay.visible"
      :order-no="pay.orderNo"
      :deposit-amount="pay.depositAmount"
      :pay-bill-no="pay.payBillNo"
      :pay-deadline="pay.payDeadline"
      @paid="fetchList"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Box, Clock, Money, Timer, User } from '@element-plus/icons-vue'
import { cancelReservation, getMyReservations } from '@/api/reservation'
import DepositPayDialog from '@/components/reservation/DepositPayDialog.vue'
import { usePaymentCountdown } from '@/composables/usePaymentCountdown'
import {
  RESERVATION_STATUS_OPTIONS,
  canCancel,
  depositStatusLabel,
  formatAmount,
  reservationStatusLabel,
  reservationStatusTag
} from '@/utils/reservation'

const router = useRouter()

// 缴费截止倒计时（共享 composable，内部自带每秒心跳与清理）
const { payCountdown, deadlineClass } = usePaymentCountdown()

const loading = ref(false)
const list = ref([])
const total = ref(0)

const query = reactive({
  status: '',
  page: 1,
  pageSize: 10
})

// 押金缴纳弹窗状态
const pay = reactive({
  visible: false,
  orderNo: '',
  depositAmount: 0,
  payBillNo: '',
  payDeadline: ''
})

// 4.3.7 我的预约列表
async function fetchList() {
  loading.value = true
  try {
    const params = { page: query.page, pageSize: query.pageSize }
    if (query.status) params.status = query.status
    const data = await getMyReservations(params)
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

function goDetail(item) {
  router.push(`/reservations/${item.orderNo}`)
}

function goTools() {
  router.push('/tools')
}

// 打开押金缴纳弹窗
function openPay(item) {
  Object.assign(pay, {
    visible: true,
    orderNo: item.orderNo,
    depositAmount: item.depositAmount,
    payBillNo: item.refundInfo?.payBillNo || '',
    payDeadline: item.payDeadline || ''
  })
}

// 4.3.5 取消预约（取件前 24 小时内不可取消，由后端校验）
async function openCancel(item) {
  let reason = ''
  try {
    const { value } = await ElMessageBox.prompt('请输入取消原因（选填，便于社区了解情况）', '取消预约', {
      confirmButtonText: '确认取消',
      cancelButtonText: '我再想想',
      inputType: 'textarea',
      inputPlaceholder: '如：临时有事无法取件',
      inputValidator: (v) => (v && v.length > 200 ? '取消原因不超过 200 字' : true),
      type: 'warning'
    })
    reason = value || ''
  } catch {
    return // 用户放弃取消
  }

  try {
    const data = await cancelReservation(item.orderNo, { cancelReason: reason.trim() || undefined })
    ElMessage.success(
      `预约已取消，押金 ¥${formatAmount(data?.refundAmount)} 将全额退还（${data?.refundStatus === 'PROCESSING' ? '处理中' : '已完成'}）`
    )
    fetchList()
  } catch {
    // 错误提示已由请求拦截器统一处理（如 42002 距取件不足 24 小时）
  }
}

onMounted(fetchList)
</script>

<style lang="scss" scoped>
.filter-card {
  margin-bottom: var(--space-md);

  .filter-head {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
  }

  .page-title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    padding-left: var(--space-sm);
    border-left: 4px solid var(--color-primary);
    line-height: 1.2;
  }

  .page-sub {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .status-filter {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }
}

.res-list {
  display: grid;
  gap: var(--space-md);
}

.res-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  transition: box-shadow 0.25s ease, transform 0.25s ease;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;

    .tool-name {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 60vw;
    }
  }

  .order-no {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    font-family: ui-monospace, Menlo, Consolas, monospace;
  }

  &__body {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--space-sm) var(--space-lg);
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    flex-wrap: wrap;
    border-top: 1px dashed var(--border-lighter);
    padding-top: var(--space-md);
  }
}

.info-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
  color: var(--text-regular);
  min-width: 0;

  .el-icon {
    color: var(--color-primary);
    flex-shrink: 0;
  }

  &__label {
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  &__value {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.pay-countdown {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  background: rgba(230, 162, 60, 0.1);
  color: var(--color-warning);

  .el-icon {
    flex-shrink: 0;
  }

  span {
    font-variant-numeric: tabular-nums;
  }

  &.is-warning {
    color: var(--color-warning);
  }

  &.is-urgent,
  &.is-overdue {
    color: var(--color-danger);
    font-weight: 600;
    background: rgba(245, 108, 108, 0.1);
  }
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-md);
}

@media (max-width: 768px) {
  .res-card .order-no {
    max-width: 100%;
  }

  .pagination-bar {
    justify-content: center;
  }
}
</style>
