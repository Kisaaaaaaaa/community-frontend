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
          <div class="tool-summary__code">编号 {{ toolCode }}</div>
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
        <div class="step-head__right">
          <span v-if="businessHours" class="business-hint">
            <el-icon><Clock /></el-icon>
            {{ businessHours.start }} ~ {{ businessHours.end }}
          </span>
          <el-button text type="primary" :loading="slotsLoading" @click="fetchSlots">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </div>

      <div class="select-hint">
        先在上方日历选日期，再点 <span>起始</span> 与 <span>结束</span> 时段；支持跨天连续预约（如 10-16 20:00 → 10-17 08:00）
      </div>

      <div v-loading="slotsLoading" class="picker-layout">
        <!-- 日历 -->
        <div class="calendar">
          <div class="calendar__head">
            <button type="button" class="nav-btn" :disabled="!canGoPrev" @click="shiftMonth(-1)">
              <el-icon><ArrowLeft /></el-icon>
            </button>
            <span class="calendar__title">{{ calendarTitle }}</span>
            <button type="button" class="nav-btn" :disabled="!canGoNext" @click="shiftMonth(1)">
              <el-icon><ArrowRight /></el-icon>
            </button>
            <el-button link type="primary" class="today-btn" @click="goToday">回到今天</el-button>
          </div>

          <div class="calendar__week">
            <span v-for="w in WEEK_HEAD" :key="w">{{ w }}</span>
          </div>

          <div class="calendar__grid">
            <button
              v-for="cell in calendarCells"
              :key="cell.key"
              type="button"
              class="day-cell"
              :class="cellClass(cell)"
              :disabled="!cell.day"
              @click="cell.day && (activeDate = cell.date)"
            >
              <span class="day-cell__num">{{ cell.dayOfMonth }}</span>
              <span v-if="cell.day" class="day-cell__bar">
                <i :style="{ width: availabilityPercent(cell.day) + '%' }" />
              </span>
            </button>
          </div>

          <div class="calendar__legend">
            <span><i class="dot dot--full" />可预约</span>
            <span><i class="dot dot--partial" />部分预约</span>
            <span><i class="dot dot--none" />已约满</span>
            <span><i class="dot dot--closed" />未开放</span>
          </div>

          <div v-if="days.length" class="calendar__range">
            可预约范围：{{ shortDate(todayStr) }} ~ {{ shortDate(lastLoadedDate) }}
          </div>
        </div>

        <!-- 当日时段 -->
        <div class="slots-panel">
          <div class="slots-panel__head">
            <div class="slots-panel__date">
              <span class="date-text">{{ activeDate ? shortDate(activeDate) : '—' }}</span>
              <span class="week-text">{{ activeDate ? weekday(activeDate) : '' }}</span>
            </div>
            <span v-if="activeFreeCount" class="free-text">{{ activeFreeCount }} 个空闲</span>
          </div>

          <div v-if="activeHours.length" class="slot-grid">
            <button
              v-for="s in activeHours"
              :key="s.startTime"
              type="button"
              class="slot-btn"
              :class="{
                'is-occupied': !s.available,
                'is-in-range': isInRange(s),
                'is-start': isStart(s),
                'is-end': isEnd(s)
              }"
              :disabled="!s.available"
              @click="selectSlot(s)"
            >
              <span class="slot-time">{{ timeOnly(s.startTime) }}</span>
              <span class="slot-tag">{{ s.available ? '可预约' : '已占用' }}</span>
            </button>
          </div>

          <el-empty v-else description="当日暂无可预约时段" :image-size="80" />
        </div>
      </div>

      <el-empty
        v-if="!slotsLoading && !days.length"
        description="该工具暂无开放的可预约时段"
      />
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
          <span class="label">租赁时段</span>
          <span class="value">
            {{ selected.startTime }}
            <template v-if="selected.endTime"> ~ {{ selected.endTime }}</template>
            <span v-else class="pending">（请点击结束时段）</span>
          </span>
          <span v-if="durationText" class="duration">共 {{ durationText }}</span>
          <el-button link type="primary" @click="clearSelection">重选</el-button>
        </template>
        <span v-else class="tip">请先选择起始时段，再点击结束时段</span>
      </div>
      <div class="submit-bar__actions">
        <el-button class="btn-accessible" @click="goBack">返回</el-button>
        <el-button
          type="primary"
          class="btn-accessible"
          :loading="submitting"
          :disabled="!selected.startTime || !selected.endTime"
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
import { ArrowLeft, ArrowRight, Box, Clock, Refresh } from '@element-plus/icons-vue'
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
// 后端 4.3.1 返回：{ granularity, businessHours:{start,end}, days:[{ date, hours:[...] }] }
const days = ref([])
const businessHours = ref(null)
const activeDate = ref('')
const selected = reactive({ startTime: '', endTime: '' })

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const WEEK_HEAD = ['日', '一', '二', '三', '四', '五', '六']

// 日历游标（当前展示的年 / 月）
const today = new Date()
const cursor = reactive({ year: today.getFullYear(), month: today.getMonth() })

function toDateStr(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const todayStr = toDateStr(today)

// 后端返回的日期 → 当天时段数据
const dayMap = computed(() => Object.fromEntries(days.value.map((d) => [d.date, d])))

const activeDay = computed(() => dayMap.value[activeDate.value] || null)
const activeHours = computed(() => activeDay.value?.hours || [])
const activeFreeCount = computed(() => (activeDay.value ? availableCount(activeDay.value) : 0))

const calendarTitle = computed(
  () => `${cursor.year} 年 ${String(cursor.month + 1).padStart(2, '0')} 月`
)

// 已加载数据的最后一天（后端 4.3.1 的 days 上限为 42，超出该范围即视为「未开放」）
const lastLoadedDate = computed(() => days.value[days.value.length - 1]?.date || todayStr)

// 上一月：不早于今天所在月份
const canGoPrev = computed(
  () =>
    cursor.year > today.getFullYear() ||
    (cursor.year === today.getFullYear() && cursor.month > today.getMonth())
)

// 下一月：该月首日仍在已加载数据范围内
const canGoNext = computed(
  () => toDateStr(new Date(cursor.year, cursor.month + 1, 1)) <= lastLoadedDate.value
)

// 生成月视图 7 列网格（含前导空位）
const calendarCells = computed(() => {
  const { year, month } = cursor
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ key: `pad-${i}`, date: '', dayOfMonth: '', day: null })
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ key: date, date, dayOfMonth: d, day: dayMap.value[date] || null })
  }
  return cells
})

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

function timeOnly(datetime) {
  return String(datetime || '').split(' ')[1] || datetime || ''
}

function weekday(dateStr) {
  const d = new Date(String(dateStr).replace(/-/g, '/'))
  return Number.isNaN(d.getDay()) ? '' : WEEK[d.getDay()]
}

// 展示为 MM-DD
function shortDate(dateStr) {
  const parts = String(dateStr || '').split('-')
  return parts.length === 3 ? `${parts[1]}-${parts[2]}` : dateStr
}

// 某日可预约（空闲）小时数
function availableCount(day) {
  return (day?.hours || []).filter((h) => h.available).length
}

// 当日空闲占比（用于日历格里的进度条）
function availabilityPercent(day) {
  const total = (day?.hours || []).length
  if (!total) return 0
  return Math.round((availableCount(day) / total) * 100)
}

// 日历格状态：full 全可约 / partial 部分 / none 约满 / closed 未开放
function cellClass(cell) {
  if (!cell.day) return { 'is-closed': true }
  const total = (cell.day.hours || []).length
  const free = availableCount(cell.day)
  return {
    'is-active': cell.date === activeDate.value,
    'is-in-range': inRangeDay(cell.date),
    'is-today': cell.date === todayStr,
    'is-full': free > 0 && free === total,
    'is-partial': free > 0 && free < total,
    'is-none': free === 0
  }
}

// 是否为区间起始格
function isStart(slot) {
  return slot.startTime === selected.startTime
}

// 是否为区间结束格
function isEnd(slot) {
  return !!selected.endTime && slot.endTime === selected.endTime
}

// 是否落在已选区间内（用于区间高亮）
function isInRange(slot) {
  return (
    !!selected.startTime &&
    !!selected.endTime &&
    slot.startTime >= selected.startTime &&
    slot.endTime <= selected.endTime
  )
}

// 日期是否落在已选区间内
function inRangeDay(date) {
  if (!selected.startTime) return false
  const startDate = selected.startTime.slice(0, 10)
  const endDate = (selected.endTime || selected.startTime).slice(0, 10)
  return date >= startDate && date <= endDate
}

// 时长文案
const durationText = computed(() => {
  if (!selected.startTime || !selected.endTime) return ''
  const start = new Date(selected.startTime.replace(/-/g, '/')).getTime()
  const end = new Date(selected.endTime.replace(/-/g, '/')).getTime()
  const hours = (end - start) / 3600000
  if (!(hours > 0)) return ''
  if (hours < 24) return `${hours} 小时`
  const d = Math.floor(hours / 24)
  const rest = hours % 24
  return rest ? `${d} 天 ${rest} 小时` : `${d} 天`
})

// 两段式区间选择：先点起始，再点结束；支持跨天
// 再次点击时：不早于起点视为「结束」（同一格再点一次即为 1 小时），否则重新选择起始
function selectSlot(slot) {
  if (!selected.startTime || selected.endTime) {
    selected.startTime = slot.startTime
    selected.endTime = ''
    return
  }
  if (slot.startTime >= selected.startTime) {
    selected.endTime = slot.endTime
  } else {
    selected.startTime = slot.startTime
    selected.endTime = ''
  }
}

function clearSelection() {
  selected.startTime = ''
  selected.endTime = ''
}

// 切换日历月份
function shiftMonth(step) {
  let month = cursor.month + step
  let year = cursor.year
  if (month < 0) {
    month = 11
    year -= 1
  } else if (month > 11) {
    month = 0
    year += 1
  }
  cursor.month = month
  cursor.year = year
}

// 回到今天所在月份，并定位到最近的可约日期
function goToday() {
  cursor.year = today.getFullYear()
  cursor.month = today.getMonth()
  const first = days.value.find((d) => !calendarPastGuard(d.date) && availableCount(d) > 0)
  if (first) activeDate.value = first.date
}

// 日期早于今天（日历上仅作展示，不参与可约判断）
function calendarPastGuard(date) {
  return date < todayStr
}

// 后端 4.3.1 的 days 取值上限为 42，取满以便日历可翻看到下个月
const SLOT_DAYS = 42

// 4.3.1 查询工具可预约时段（从今天起 42 天）
async function fetchSlots() {
  if (!toolCode.value) {
    ElMessage.error('缺少工具编码，无法预约')
    return
  }
  slotsLoading.value = true
  try {
    const data = await getAvailableSlots(toolCode.value, { days: SLOT_DAYS })
    days.value = data?.days || []
    businessHours.value = data?.businessHours || null
    // 默认选中「第一个存在空闲时段」的日期，并把日历定位到该月
    const firstAvailable = days.value.find((d) => availableCount(d) > 0) || days.value[0]
    if (firstAvailable) {
      activeDate.value = firstAvailable.date
      const [y, m] = firstAvailable.date.split('-').map(Number)
      cursor.year = y
      cursor.month = m - 1
    } else {
      activeDate.value = ''
    }
  } finally {
    slotsLoading.value = false
  }
}

// 4.3.2 冲突校验 → 4.3.3 创建预约 → 引导缴费
async function handleSubmit() {
  await formRef.value.validate()
  if (!selected.startTime) {
    ElMessage.warning('请先选择起始时段')
    return
  }
  if (!selected.endTime) {
    ElMessage.warning('请再点击结束时段，完成区间选择')
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
    box-shadow: 0 6px 16px rgba(64, 158, 255, 0.28);
    flex-shrink: 0;
  }

  &__name {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__code {
    margin-top: 2px;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    letter-spacing: 0.3px;
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
      font-variant-numeric: tabular-nums;
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
  flex-wrap: wrap;
}

.step-head__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.step-index {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), #79bbff);
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

.business-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  padding: 2px 10px;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 999px;
}

.select-hint {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.6;

  span {
    color: var(--color-primary);
    font-weight: 600;
  }
}

/* ---------- 日历 + 时段 双栏 ---------- */
.picker-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: var(--space-lg);
  align-items: start;
}

.calendar {
  display: grid;
  gap: var(--space-sm);

  &__head {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  &__title {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-primary);
    min-width: 132px;
    text-align: center;
  }

  &__week {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;

    span {
      text-align: center;
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      padding-bottom: 2px;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
  }

  &__legend {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    flex-wrap: wrap;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    padding-top: var(--space-xs);

    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;

      &--full {
        background: var(--color-success);
      }
      &--partial {
        background: var(--color-warning);
      }
      &--none {
        background: var(--color-danger);
        opacity: 0.6;
      }
      &--closed {
        background: var(--border-base);
      }
    }
  }

  &__range {
    font-size: var(--font-size-xs);
    color: var(--text-placeholder);
  }
}

.nav-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-base);
  background: var(--card-bg-color);
  color: var(--text-regular);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;

    &:hover {
      border-color: var(--border-base);
      color: var(--text-regular);
    }
  }
}

.today-btn {
  margin-left: auto;
}

.day-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  aspect-ratio: 1 / 1;
  padding: 4px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: #f7f9fc;
  cursor: pointer;
  transition: all 0.18s ease;

  &__num {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1;
  }

  &__bar {
    width: 68%;
    height: 4px;
    border-radius: 2px;
    background: rgba(0, 0, 0, 0.07);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: 2px;
      background: var(--color-success);
      transition: width 0.25s ease;
    }
  }

  &.is-partial .day-cell__bar i {
    background: var(--color-warning);
  }

  &.is-none {
    background: #f2f3f5;

    .day-cell__num {
      color: var(--text-placeholder);
    }

    .day-cell__bar i {
      background: var(--text-placeholder);
    }
  }

  &.is-closed {
    background: transparent;
    cursor: not-allowed;

    .day-cell__num {
      color: var(--text-placeholder);
      opacity: 0.5;
      font-weight: 400;
    }
  }

  &.is-today:not(.is-active) {
    box-shadow: inset 0 0 0 1.5px rgba(64, 158, 255, 0.55);
  }

  &:hover:not(:disabled):not(.is-active) {
    border-color: var(--color-primary);
    background: #fff;
    transform: translateY(-1px);
  }

  &.is-in-range:not(.is-active) {
    background: rgba(64, 158, 255, 0.1);
    border-color: rgba(64, 158, 255, 0.4);
  }

  &.is-active {
    background: linear-gradient(135deg, var(--color-primary), #79bbff);
    border-color: var(--color-primary);
    box-shadow: 0 6px 16px rgba(64, 158, 255, 0.35);

    .day-cell__num {
      color: #fff;
    }

    .day-cell__bar {
      background: rgba(255, 255, 255, 0.35);

      i {
        background: #fff;
      }
    }
  }
}

/* ---------- 当日时段面板 ---------- */
.slots-panel {
  display: grid;
  gap: var(--space-md);
  align-content: start;
  border-left: 1px dashed var(--border-lighter);
  padding-left: var(--space-lg);

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  &__date {
    display: flex;
    align-items: baseline;
    gap: 6px;

    .date-text {
      font-size: var(--font-size-lg);
      font-weight: 700;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
    }

    .week-text {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }

  .free-text {
    font-size: var(--font-size-xs);
    color: var(--color-success);
    background: rgba(103, 194, 58, 0.1);
    padding: 2px 8px;
    border-radius: 999px;
  }
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: var(--space-sm);
}

.slot-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-sm) var(--space-xs);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-base);
  background: var(--card-bg-color);
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: center;

  .slot-time {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  .slot-tag {
    font-size: var(--font-size-xs);
    color: var(--color-success);
  }

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    box-shadow: 0 2px 10px rgba(64, 158, 255, 0.2);
    transform: translateY(-1px);
  }

  &.is-occupied {
    background: #f5f7fa;
    cursor: not-allowed;

    .slot-time {
      color: var(--text-placeholder);
    }

    .slot-tag {
      color: var(--text-secondary);
    }
  }

  // 区间内（浅色高亮）
  &.is-in-range:not(.is-occupied):not(.is-start):not(.is-end) {
    border-color: rgba(64, 158, 255, 0.5);
    background: rgba(64, 158, 255, 0.08);

    .slot-tag {
      color: var(--color-primary);
    }
  }

  // 起点 / 终点（实心强调）
  &.is-start,
  &.is-end {
    border-color: var(--color-primary);
    background: linear-gradient(135deg, var(--color-primary), #79bbff);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);

    .slot-time,
    .slot-tag {
      color: #fff;
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
  z-index: 5;

  &__info {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
    flex-wrap: wrap;

    .label {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .value {
      font-weight: 600;
      color: var(--text-primary);
    }

    .pending {
      color: var(--color-warning);
      font-weight: 400;
      font-size: var(--font-size-sm);
    }

    .duration {
      font-size: var(--font-size-sm);
      color: var(--color-primary);
      background: rgba(64, 158, 255, 0.1);
      padding: 1px 8px;
      border-radius: 10px;
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

@media (max-width: 900px) {
  .picker-layout {
    grid-template-columns: 1fr;
  }

  .slots-panel {
    border-left: none;
    padding-left: 0;
    border-top: 1px dashed var(--border-lighter);
    padding-top: var(--space-md);
  }
}

@media (max-width: 768px) {
  .slot-grid {
    grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  }

  .submit-bar__actions {
    width: 100%;

    .el-button {
      flex: 1;
    }
  }
}
</style>
