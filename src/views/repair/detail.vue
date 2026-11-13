<template>
  <div class="repair-detail-page">
    <!-- 加载中 -->
    <el-skeleton v-if="loading" :rows="12" animated class="card-box" />

    <template v-else-if="detail">
      <!-- ===== Hero 顶部：返回按钮 + 工单号 + 状态 + 操作 ===== -->
      <div class="hero" :class="heroClass">
        <!-- 第一行：返回按钮 + 工单号 + 状态标签 -->
        <div class="hero-row hero-row--top">
          <button class="hero-back" type="button" @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回列表</span>
          </button>
          <div class="hero-title">
            <span class="hero-no">{{ detail.repairNo }}</span>
            <el-tag class="hero-status" effect="dark" round :type="statusTagType(detail.status)">
              {{ repairStatusLabel(detail.status) }}
            </el-tag>
            <el-tag
              v-if="detail.progressStatus"
              :type="progressTagType(detail.progressStatus)"
              round size="small"
            >{{ progressLabel(detail.progressStatus) }}</el-tag>
            <el-tag
              v-if="isStaffOrAdmin && detail.feeStatus && detail.feeStatus !== 'UNPAID'"
              :type="feeTagType(detail.feeStatus)" round size="small"
            >费用：{{ feeStatusLabel(detail.feeStatus) }}</el-tag>
          </div>
        </div>

        <!-- 第二行：工具信息 + 报修人 + 提交时间 -->
        <div class="hero-row hero-row--main">
          <div class="hero-col">
            <div class="hero-tool">{{ detail.toolName || '工具' }}</div>
            <div class="hero-code">
              <el-icon><Box /></el-icon>
              <span>{{ detail.toolCode }}</span>
              <span v-if="detail.toolModel" class="hero-model">· {{ detail.toolModel }}</span>
            </div>
          </div>
          <div class="hero-col hero-col--meta">
            <div class="hero-meta">
              <span class="hero-meta__label">报修人</span>
              <span class="hero-meta__value">{{ detail.reporterName || '-' }}</span>
            </div>
            <div class="hero-meta">
              <span class="hero-meta__label">提交时间</span>
              <span class="hero-meta__value">{{ detail.submitTime }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="hero-actions">
            <el-button
              v-if="canVerify"
              type="warning" round size="default"
              :icon="DocumentChecked"
              @click="verifyVisible = true"
            >现场核验</el-button>
            <el-button
              v-if="canUpdateProgress"
              type="primary" round size="default"
              :icon="Edit"
              @click="progressVisible = true"
            >更新维修进度</el-button>
            <el-button
              v-if="canAccept"
              type="success" round size="default"
              :icon="CircleCheckFilled"
              @click="acceptVisible = true"
            >维修后验收</el-button>
            <el-button
              v-if="hasFee"
              round size="default"
              :icon="Money"
              :loading="feeLoading"
              @click="fetchFeeStatus(true)"
            >同步费用状态</el-button>
          </div>
        </div>
      </div>

      <!-- ===== 流程进度 ===== -->
      <div class="card-box steps-card">
        <el-steps :active="activeStep" align-center finish-status="success" process-status="finish">
          <el-step title="提交报修" />
          <el-step title="现场核验" />
          <el-step title="维修中" />
          <el-step title="维修完成" />
          <el-step title="验收关闭" />
        </el-steps>
      </div>

      <!-- ===== 信息区 ===== -->
      <div class="info-grid">
        <!-- 报修信息 -->
        <div class="card-box info-card">
          <h4 class="section-title">
            <span class="section-title__icon"><el-icon><Warning /></el-icon></span>
            报修信息
          </h4>
          <div class="kv-list">
            <div class="kv-item">
              <span class="kv-label">关联租赁单</span>
              <span class="kv-value mono">{{ detail.relatedOrderNo }}</span>
            </div>
            <div class="kv-item">
              <span class="kv-label">损坏部位</span>
              <span class="kv-value">{{ detail.damagePart }}</span>
            </div>
            <div class="kv-item kv-item--full">
              <span class="kv-label">损坏描述</span>
              <span class="kv-value kv-value--desc">{{ detail.damageDescription }}</span>
            </div>
            <div
              v-if="detail.attachmentUrls?.length"
              class="kv-item kv-item--full"
            >
              <span class="kv-label">损坏附件</span>
              <div class="kv-value">
                <el-image
                  v-for="(url, idx) in detail.attachmentUrls"
                  :key="idx"
                  :src="url"
                  :preview-src-list="detail.attachmentUrls"
                  :initial-index="idx"
                  fit="cover"
                  class="attachment"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 核验信息 -->
        <div class="card-box info-card" v-if="detail.verifyResult">
          <h4 class="section-title">
            <span class="section-title__icon"><el-icon><DocumentChecked /></el-icon></span>
            现场核验
          </h4>
          <div class="kv-list">
            <div class="kv-item">
              <span class="kv-label">核验人</span>
              <span class="kv-value">{{ detail.verifier || '-' }}</span>
            </div>
            <div class="kv-item">
              <span class="kv-label">核验时间</span>
              <span class="kv-value">{{ detail.verifyTime || '-' }}</span>
            </div>
            <div class="kv-item">
              <span class="kv-label">核验结果</span>
              <span class="kv-value">
                <el-tag :type="verifyResultTagType(detail.verifyResult)" size="small">
                  {{ verifyResultLabel(detail.verifyResult) }}
                </el-tag>
              </span>
            </div>
            <div v-if="detail.verifyRemark" class="kv-item kv-item--full">
              <span class="kv-label">核验说明</span>
              <span class="kv-value kv-value--desc">{{ detail.verifyRemark }}</span>
            </div>
          </div>
        </div>

        <!-- 维修进度 -->
        <div class="card-box info-card" v-if="detail.repairer || detail.progressStatus">
          <h4 class="section-title">
            <span class="section-title__icon"><el-icon><Tools /></el-icon></span>
            维修进度
          </h4>
          <div class="kv-list">
            <div class="kv-item">
              <span class="kv-label">维修负责人</span>
              <span class="kv-value">{{ detail.repairer || '-' }}</span>
            </div>
            <div class="kv-item">
              <span class="kv-label">开始时间</span>
              <span class="kv-value">{{ detail.repairStartTime || '-' }}</span>
            </div>
            <div class="kv-item">
              <span class="kv-label">当前进度</span>
              <span class="kv-value">
                <el-tag v-if="detail.progressStatus" :type="progressTagType(detail.progressStatus)" size="small">
                  {{ progressLabel(detail.progressStatus) }}
                </el-tag>
                <span v-else class="muted">—</span>
              </span>
            </div>
            <div class="kv-item">
              <span class="kv-label">预计时长</span>
              <span class="kv-value">{{ detail.expectedDuration || '-' }}</span>
            </div>
            <div class="kv-item">
              <span class="kv-label">进度更新</span>
              <span class="kv-value">{{ detail.progressUpdateTime || '-' }}</span>
            </div>
            <div class="kv-item" v-if="isStaffOrAdmin">
              <span class="kv-label">维修费用</span>
              <span class="kv-value">
                <span v-if="detail.repairFee != null" class="money">¥{{ formatMoney(detail.repairFee) }}</span>
                <span v-else class="muted">—</span>
                <el-tag
                  v-if="detail.repairFee != null && detail.feeStatus"
                  :type="feeTagType(detail.feeStatus)" size="small"
                  style="margin-left: 6px"
                >{{ feeStatusLabel(detail.feeStatus) }}</el-tag>
              </span>
            </div>
            <div v-if="detail.progressDesc" class="kv-item kv-item--full">
              <span class="kv-label">进度说明</span>
              <span class="kv-value kv-value--desc">{{ detail.progressDesc }}</span>
            </div>
          </div>
        </div>

        <!-- 验收结果 -->
        <div class="card-box info-card" v-if="detail.acceptResult">
          <h4 class="section-title">
            <span class="section-title__icon"><el-icon><CircleCheckFilled /></el-icon></span>
            验收结果
          </h4>
          <div class="kv-list">
            <div class="kv-item">
              <span class="kv-label">验收人</span>
              <span class="kv-value">{{ detail.acceptor || '-' }}</span>
            </div>
            <div class="kv-item">
              <span class="kv-label">验收时间</span>
              <span class="kv-value">{{ detail.acceptTime || '-' }}</span>
            </div>
            <div class="kv-item">
              <span class="kv-label">验收结果</span>
              <span class="kv-value">
                <el-tag :type="acceptResultTagType(detail.acceptResult)" size="small">
                  {{ acceptResultLabel(detail.acceptResult) }}
                </el-tag>
              </span>
            </div>
            <div class="kv-item">
              <span class="kv-label">工具状态</span>
              <span class="kv-value">
                <el-tag
                  v-if="detail.toolStatusAfterRepair"
                  :type="toolStatusTagType(detail.toolStatusAfterRepair)"
                  size="small"
                >{{ toolStatusAfterRepairLabel(detail.toolStatusAfterRepair) }}</el-tag>
                <span v-else class="muted">—</span>
              </span>
            </div>
            <div v-if="detail.remark" class="kv-item kv-item--full">
              <span class="kv-label">验收备注</span>
              <span class="kv-value kv-value--desc">{{ detail.remark }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 维修历程时间线 ===== -->
      <div class="card-box info-section" v-if="progressLogs.length">
        <h4 class="section-title">
          <span class="section-title__icon"><el-icon><Clock /></el-icon></span>
          维修历程
        </h4>
        <el-timeline>
          <el-timeline-item
            v-for="(log, idx) in progressLogs"
            :key="idx"
            :timestamp="log.progressTime"
            placement="top"
            :type="progressTimelineType(log.progressStatus)"
          >
            <div class="log-head">
              <el-tag :type="progressTagType(log.progressStatus)" size="small">
                {{ progressLabel(log.progressStatus) }}
              </el-tag>
              <span v-if="log.repairer" class="log-meta">负责人：{{ log.repairer }}</span>
              <span v-if="log.repairFee != null && isStaffOrAdmin" class="log-meta">费用 ¥{{ formatMoney(log.repairFee) }}</span>
            </div>
            <p class="log-desc">{{ log.progressDesc }}</p>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- ===== 费用二维码 ===== -->
      <div class="card-box fee-card" v-if="feePayment && isStaffOrAdmin">
        <h4 class="section-title">
          <span class="section-title__icon"><el-icon><Money /></el-icon></span>
          维修费用支付
        </h4>
        <div class="fee-row">
          <div class="fee-info">
            <div class="fee-amount">¥{{ formatMoney(feePayment.amount) }}</div>
            <div class="fee-sub">
              <div>支付单号 <span class="mono">{{ feePayment.payNo }}</span></div>
              <div>支付渠道 {{ payChannelLabel(feePayment.payChannel) }}</div>
              <div>
                状态
                <el-tag :type="paymentOrderTagType(feePayment.status)" size="small" style="margin-left:6px">
                  {{ paymentOrderLabel(feePayment.status) }}
                </el-tag>
              </div>
              <div v-if="feePayment.expireTime">过期时间：{{ feePayment.expireTime }}</div>
              <div v-if="feePayment.paidTime">已支付时间：{{ feePayment.paidTime }}</div>
            </div>
            <el-button
              v-if="canAccept && feePayment.status === 'PENDING'"
              type="primary" round
              :loading="feeLoading"
              @click="fetchFeeStatus(true)"
            >刷新支付状态</el-button>
          </div>
          <div v-if="feePayment.payUrl" class="fee-qr">
            <el-button type="primary" round :icon="Grid" @click="payQrVisible = true">
              显示支付二维码
            </el-button>
            <a :href="feePayment.payUrl" target="_blank" class="pay-link">在本机打开支付页面 →</a>
            <div class="qr-tip">手机支付宝扫码完成支付</div>
          </div>
        </div>
      </div>
    </template>

    <!-- 不存在 -->
    <el-result v-else icon="warning" title="报修单不存在" sub-title="请检查报修单号是否正确">
      <template #extra>
        <el-button @click="$router.back()">返回列表</el-button>
      </template>
    </el-result>
    <!-- 核验弹窗 -->
    <el-dialog v-model="verifyVisible" title="现场核验" width="520px" :close-on-click-modal="false">
      <el-form ref="verifyFormRef" :model="verifyForm" :rules="verifyRules" label-width="100px">
        <el-form-item label="核验结果" prop="verifyResult">
          <el-radio-group v-model="verifyForm.verifyResult">
            <el-radio
              v-for="it in VERIFY_RESULT_OPTIONS"
              :key="it.value" :label="it.value"
            >{{ it.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="核验说明" prop="verifyRemark">
          <el-input
            v-model="verifyForm.verifyRemark"
            type="textarea"
            :rows="3"
            maxlength="500" show-word-limit
            placeholder="请填写核验说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyVisible = false">取消</el-button>
        <el-button type="primary" :loading="verifySubmitting" @click="handleVerify">确认核验</el-button>
      </template>
    </el-dialog>

    <!-- 进度更新弹窗 -->
    <el-dialog v-model="progressVisible" title="更新维修进度" width="560px" :close-on-click-modal="false">
      <el-form ref="progressFormRef" :model="progressForm" :rules="progressRules" label-width="110px">
        <el-form-item label="维修负责人" prop="repairer">
          <el-input v-model="progressForm.repairer" placeholder="填写负责维修的人员姓名" maxlength="100" />
        </el-form-item>
        <el-form-item label="预计时长">
          <el-input v-model="progressForm.expectedDuration" placeholder="如 2 小时 / 明天上午" maxlength="50" />
        </el-form-item>
        <el-form-item label="维修费用" v-if="progressForm.progressStatus && progressForm.progressStatus !== 'REPAIRED' && progressForm.progressStatus !== 'FAILED'">
          <el-input-number
            v-model="progressForm.repairFee"
            :min="0" :precision="2" :step="10"
            placeholder="0.00"
            style="width: 100%"
          />
          <div class="field-tip">填写费用后将生成支付单，支付后才可继续后续环节</div>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="progressForm.repairStartTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm"
            placeholder="可选"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="当前进度" prop="progressStatus">
          <el-radio-group v-model="progressForm.progressStatus">
            <el-radio
              v-for="it in PROGRESS_STATUS_OPTIONS"
              :key="it.value" :label="it.value"
            >{{ it.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="进度说明" prop="progressDesc">
          <el-input
            v-model="progressForm.progressDesc"
            type="textarea"
            :rows="3" maxlength="500" show-word-limit
            placeholder="请填写本次进度变更说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="progressVisible = false">取消</el-button>
        <el-button type="primary" :loading="progressSubmitting" @click="handleProgress">提交更新</el-button>
      </template>
    </el-dialog>

    <!-- 验收弹窗 -->
    <el-dialog v-model="acceptVisible" title="维修后验收" width="560px" :close-on-click-modal="false">
      <el-alert
        v-if="detail?.progressStatus === 'FAILED'"
        type="error" :closable="false" show-icon
        title="当前进度为 FAILED（维修失败），仅允许验收结果为『不合格』，toolStatus 可选报废或二次维修"
        style="margin-bottom: var(--space-md)"
      />
      <el-form ref="acceptFormRef" :model="acceptForm" :rules="acceptRules" label-width="110px">
        <el-form-item label="验收结果" prop="acceptResult">
          <el-radio-group v-model="acceptForm.acceptResult" @change="onAcceptComboChange">
            <el-radio
              v-for="it in filteredAcceptOptions"
              :key="it.value" :label="it.value" :disabled="detail?.progressStatus === 'FAILED' && it.value !== 'UNQUALIFIED'"
            >{{ it.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="工具状态" prop="toolStatus">
          <el-radio-group v-model="acceptForm.toolStatus" @change="onAcceptComboChange">
            <el-radio
              v-for="it in filteredToolOptions"
              :key="it.value" :label="it.value"
            >{{ it.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="重估损坏等级" prop="damageLevel">
          <el-radio-group v-model="acceptForm.damageLevel">
            <el-radio :label="1">1（轻微）</el-radio>
            <el-radio :label="2">2（一般）</el-radio>
            <el-radio :label="3">3（较重）</el-radio>
            <el-radio :label="4">4（严重）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="验收备注">
          <el-input
            v-model="acceptForm.remark"
            type="textarea"
            :rows="2" maxlength="500" show-word-limit
            placeholder="可选"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="acceptVisible = false">取消</el-button>
        <el-button type="primary" :loading="acceptSubmitting" @click="handleAccept">确认验收</el-button>
      </template>
    </el-dialog>

    <!-- 大尺寸支付二维码：收银台链接较长，小尺寸二维码无法识别 -->
    <PayQrDialog
      v-if="feePayment"
      v-model="payQrVisible"
      :pay-url="feePayment.payUrl"
      :pay-no="feePayment.payNo"
      :amount="formatMoney(feePayment.amount)"
      :expire-time="feePayment.expireTime"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, DocumentChecked, Edit, CircleCheckFilled, Money,
  Box, Warning, Tools, Clock, Grid
} from '@element-plus/icons-vue'
import {
  getRepairDetail,
  verifyRepair,
  updateRepairProgress,
  acceptRepair,
  getRepairProgressLogs,
  getRepairFeePayment,
  REPAIR_STATUS,
  REPAIR_STATUS_OPTIONS,
  VERIFY_RESULT_OPTIONS,
  PROGRESS_STATUS_OPTIONS,
  ACCEPT_RESULT_OPTIONS,
  TOOL_STATUS_AFTER_REPAIR_OPTIONS,
  FEE_STATUS
} from '@/api/repair'
import { useUserStore } from '@/store/user'
import { payChannelLabel } from '@/utils/reservation'
import PayQrDialog from '@/components/payment/PayQrDialog.vue'

const route = useRoute()
const userStore = useUserStore()

const repairNo = computed(() => route.params.repairNo)
const isStaff = computed(() => userStore.role === 'STAFF')
const isStaffOrAdmin = computed(() => userStore.role === 'STAFF' || userStore.role === 'ADMIN')

const loading = ref(false)
const detail = ref(null)
const progressLogs = ref([])
const feePayment = ref(null)
const feeLoading = ref(false)
const payQrVisible = ref(false)

// 弹窗状态
const verifyVisible = ref(false)
const progressVisible = ref(false)
const acceptVisible = ref(false)

const verifySubmitting = ref(false)
const progressSubmitting = ref(false)
const acceptSubmitting = ref(false)

// ========== 字典 ==========
const repairStatusLabel = (v) => REPAIR_STATUS_OPTIONS.find(o => o.value === v)?.label || v
const verifyResultLabel = (v) => VERIFY_RESULT_OPTIONS.find(o => o.value === v)?.label || v
const progressLabel = (v) => PROGRESS_STATUS_OPTIONS.find(o => o.value === v)?.label || v
const acceptResultLabel = (v) => ACCEPT_RESULT_OPTIONS.find(o => o.value === v)?.label || v
const toolStatusAfterRepairLabel = (v) => TOOL_STATUS_AFTER_REPAIR_OPTIONS.find(o => o.value === v)?.label || v

const statusTagType = (v) => ({
  [REPAIR_STATUS.SUBMITTED]: 'warning',
  [REPAIR_STATUS.VERIFYING]: 'warning',
  [REPAIR_STATUS.REPAIRING]: 'primary',
  [REPAIR_STATUS.REPAIRED]: 'success',
  [REPAIR_STATUS.CLOSED]: 'info',
  [REPAIR_STATUS.REJECTED]: 'danger'
}[v] || 'info')
const verifyResultTagType = (v) => v === 'CONFIRMED' ? 'danger' : v === 'SUSPECTED' ? 'warning' : 'info'
const progressTagType = (v) => v === 'WAIT_PART' ? 'warning' : v === 'REPAIRING' ? 'primary' : v === 'REPAIRED' ? 'success' : v === 'FAILED' ? 'danger' : 'info'
const progressTimelineType = (v) => v === 'REPAIRED' ? 'success' : v === 'FAILED' ? 'danger' : v === 'WAIT_PART' ? 'warning' : 'primary'
const acceptResultTagType = (v) => v === 'QUALIFIED' ? 'success' : v === 'PARTIAL' ? 'warning' : 'danger'
const toolStatusTagType = (v) => v === 'AVAILABLE' ? 'success' : v === 'REPAIRING' ? 'primary' : 'danger'
const feeTagType = (v) => v === 'PAID' ? 'success' : v === 'PAYING' ? 'warning' : 'info'
const feeStatusLabel = (v) => v === 'UNPAID' ? '未支付' : v === 'PAYING' ? '支付中' : v === 'PAID' ? '已支付' : v
const paymentOrderTagType = (v) => v === 'PAID' ? 'success' : v === 'FAILED' ? 'danger' : v === 'CLOSED' ? 'info' : 'warning'
const paymentOrderLabel = (v) => v === 'PENDING' ? '待支付' : v === 'PAID' ? '已支付' : v === 'CLOSED' ? '已关闭' : v === 'FAILED' ? '支付失败' : v

// ========== Hero / Steps ==========
const heroClass = computed(() => {
  const s = detail.value?.status
  if (!s) return 'hero--repairing'
  const map = {
    [REPAIR_STATUS.SUBMITTED]: 'hero--submitted',
    [REPAIR_STATUS.VERIFYING]: 'hero--verifying',
    [REPAIR_STATUS.REPAIRING]: 'hero--repairing',
    [REPAIR_STATUS.REPAIRED]: 'hero--repaired',
    [REPAIR_STATUS.CLOSED]: 'hero--closed',
    [REPAIR_STATUS.REJECTED]: 'hero--rejected',
  }
  return map[s] || 'hero--repairing'
})

// 流程步骤：0=提交报修, 1=现场核验, 2=维修中, 3=维修完成, 4=验收关闭
const activeStep = computed(() => {
  const s = detail.value?.status
  if (!s) return 0
  if (s === REPAIR_STATUS.REJECTED) return 1
  if (s === REPAIR_STATUS.SUBMITTED) return 0
  if (s === REPAIR_STATUS.VERIFYING) return 1
  if (s === REPAIR_STATUS.REPAIRING) return 2
  if (s === REPAIR_STATUS.REPAIRED) return 3
  if (s === REPAIR_STATUS.CLOSED) return 4
  return 0
})

// ========== 按钮显示条件 ==========
const canVerify = computed(() =>
  isStaff.value &&
  detail.value?.status &&
  (detail.value.status === REPAIR_STATUS.SUBMITTED || detail.value.status === REPAIR_STATUS.VERIFYING)
)

const canUpdateProgress = computed(() => {
  const s = detail.value?.status
  if (!isStaff.value || !s) return false
  // 已核验 确认损坏 才能进入维修；已驳回 或 已完结 不能再更新
  if (s === REPAIR_STATUS.REJECTED || s === REPAIR_STATUS.CLOSED) return false
  if (s === REPAIR_STATUS.SUBMITTED || s === REPAIR_STATUS.VERIFYING) return false
  return true
})

const canAccept = computed(() => {
  const s = detail.value?.status
  const ps = detail.value?.progressStatus
  if (!isStaff.value || !s) return false
  if (s !== REPAIR_STATUS.REPAIRED) return false
  return ps === 'REPAIRED' || ps === 'FAILED'
})

const hasFee = computed(() => detail.value?.repairFee != null || feePayment.value != null)

// ========== 弹窗表单 ==========
const verifyFormRef = ref(null)
const verifyForm = reactive({ verifyResult: '', verifyRemark: '' })
const verifyRules = {
  verifyResult: [{ required: true, message: '请选择核验结果', trigger: 'change' }],
  verifyRemark: [{ required: true, message: '请填写核验说明', trigger: 'blur' }]
}

const progressFormRef = ref(null)
const progressForm = reactive({
  repairer: '', expectedDuration: '', repairFee: null,
  repairStartTime: '', progressStatus: '', progressDesc: ''
})
const progressRules = {
  repairer: [{ required: true, message: '请填写维修负责人', trigger: 'blur' }],
  progressStatus: [{ required: true, message: '请选择当前进度', trigger: 'change' }],
  progressDesc: [{ required: true, message: '请填写进度说明', trigger: 'blur' }]
}

const acceptFormRef = ref(null)
const acceptForm = reactive({
  acceptResult: '', toolStatus: '', damageLevel: 1, remark: ''
})

// 验收组合约束：与后端 AcceptanceSerializer.validate 保持一致
const VALID_ACCEPT_COMBOS = {
  QUALIFIED: ['AVAILABLE'],
  PARTIAL: ['AVAILABLE'],
  UNQUALIFIED: ['REPAIRING', 'SCRAPPED']
}

const filteredAcceptOptions = computed(() => {
  if (detail.value?.progressStatus === 'FAILED') {
    return ACCEPT_RESULT_OPTIONS.filter(o => o.value === 'UNQUALIFIED')
  }
  return ACCEPT_RESULT_OPTIONS
})

const filteredToolOptions = computed(() => {
  if (!acceptForm.acceptResult) return TOOL_STATUS_AFTER_REPAIR_OPTIONS
  const allowed = VALID_ACCEPT_COMBOS[acceptForm.acceptResult] || []
  return TOOL_STATUS_AFTER_REPAIR_OPTIONS.filter(o => allowed.includes(o.value))
})

function formatMoney(v) {
  return (Number(v) || 0).toFixed(2)
}

function onAcceptComboChange() {
  const allowed = VALID_ACCEPT_COMBOS[acceptForm.acceptResult]
  if (allowed && acceptForm.toolStatus && !allowed.includes(acceptForm.toolStatus)) {
    acceptForm.toolStatus = allowed[0]
  }
  // toolStatus=AVAILABLE 时 damageLevel 须 1~3
  if (acceptForm.toolStatus === 'AVAILABLE' && acceptForm.damageLevel > 3) {
    acceptForm.damageLevel = 3
  }
}

const acceptRules = {
  acceptResult: [{ required: true, message: '请选择验收结果', trigger: 'change' }],
  toolStatus: [{ required: true, message: '请选择工具状态', trigger: 'change' }],
  damageLevel: [
    { required: true, message: '请选择损坏等级', trigger: 'change' },
    {
      validator: (rule, value, cb) => {
        if (acceptForm.toolStatus === 'AVAILABLE' && value > 3) {
          cb(new Error('AVAILABLE 时损坏等级须为 1~3'))
        } else { cb() }
      },
      trigger: 'change'
    }
  ]
}

// ========== 数据 ==========
async function loadDetail() {
  loading.value = true
  try {
    const d = await getRepairDetail(repairNo.value)
    detail.value = d?.repairOrder || null
  } catch (e) {
    detail.value = null
  } finally {
    loading.value = false
  }
}

async function loadLogs() {
  try {
    const d = await getRepairProgressLogs(repairNo.value)
    progressLogs.value = d?.logs || []
  } catch (e) {
    progressLogs.value = []
  }
}

async function fetchFeeStatus(sync = false) {
  feeLoading.value = true
  try {
    const d = await getRepairFeePayment(repairNo.value, sync)
    // detail 里 repairFee 可能尚未写入（费用刚生成），以 fee-payment 响应为准
    if (d?.repairFee != null && detail.value) {
      detail.value.repairFee = d.repairFee
      detail.value.feeStatus = d.feeStatus
    }
    feePayment.value = d?.feePayment || null
    if (sync && d?.feeStatus === 'PAID') {
      ElMessage.success('维修费已支付')
      loadDetail()
    } else if (sync && d?.feeStatus === 'UNPAID') {
      ElMessage.info('维修费尚未支付')
    }
  } finally {
    feeLoading.value = false
  }
}

// ========== 动作 ==========
async function handleVerify() {
  await verifyFormRef.value.validate()
  verifySubmitting.value = true
  try {
    await verifyRepair(repairNo.value, { ...verifyForm })
    ElMessage.success('核验提交成功')
    verifyVisible.value = false
    verifyForm.verifyResult = ''
    verifyForm.verifyRemark = ''
    await Promise.all([loadDetail(), loadLogs()])
  } finally {
    verifySubmitting.value = false
  }
}

async function handleProgress() {
  await progressFormRef.value.validate()
  progressSubmitting.value = true
  try {
    const payload = { ...progressForm }
    // 维修完成/失败无需填写费用；repairFee 为 null 会被后端判为不合法，需直接不传该字段
    if (payload.repairFee == null || ['REPAIRED', 'FAILED'].includes(payload.progressStatus)) {
      delete payload.repairFee
    }
    // 空字符串不符合 repairStartTime 的日期格式校验，未填写时不传
    if (!payload.repairStartTime) {
      delete payload.repairStartTime
    }
    await updateRepairProgress(repairNo.value, payload)
    ElMessage.success('进度已更新')
    progressVisible.value = false
    Object.assign(progressForm, {
      repairer: '', expectedDuration: '', repairFee: null,
      repairStartTime: '', progressStatus: '', progressDesc: ''
    })
    await Promise.all([loadDetail(), loadLogs(), fetchFeeStatus(false)])
  } finally {
    progressSubmitting.value = false
  }
}

async function handleAccept() {
  await acceptFormRef.value.validate()
  acceptSubmitting.value = true
  try {
    await acceptRepair(repairNo.value, { ...acceptForm })
    ElMessage.success('验收完成')
    acceptVisible.value = false
    Object.assign(acceptForm, { acceptResult: '', toolStatus: '', damageLevel: 1, remark: '' })
    await Promise.all([loadDetail(), loadLogs()])
  } finally {
    acceptSubmitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadDetail(), loadLogs()])
  if (detail.value?.repairFee != null) {
    fetchFeeStatus(false)
  }
})
</script>
<style lang="scss" scoped>
// ========= Hero 顶部 =========
.repair-detail-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  position: relative;
  overflow: hidden;
  padding: 28px 32px;
  border-radius: var(--radius-lg);
  color: #fff;
  background: linear-gradient(135deg, #337ecc, #79bbff);
  box-shadow: 0 6px 20px rgba(51, 126, 204, 0.22);

  &::before, &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(6px);
    pointer-events: none;
  }
  &::before {
    width: 260px; height: 260px;
    background: rgba(255, 255, 255, 0.12);
    top: -80px; right: -40px;
  }
  &::after {
    width: 160px; height: 160px;
    background: rgba(255, 255, 255, 0.08);
    bottom: -60px; right: 140px;
  }

  &.hero--submitted,
  &.hero--verifying {
    background: linear-gradient(135deg, #e6a23c, #f3c07b);
    box-shadow: 0 6px 20px rgba(230, 162, 60, 0.25);
  }
  &.hero--repairing {
    background: linear-gradient(135deg, #337ecc, #79bbff);
  }
  &.hero--repaired {
    background: linear-gradient(135deg, #529b2e, #85ce61);
    box-shadow: 0 6px 20px rgba(103, 194, 58, 0.25);
  }
  &.hero--closed {
    background: linear-gradient(135deg, #73767a, #a6a9ad);
    box-shadow: 0 6px 20px rgba(144, 147, 153, 0.25);
  }
  &.hero--rejected {
    background: linear-gradient(135deg, #d9534f, #f78989);
    box-shadow: 0 6px 20px rgba(217, 83, 79, 0.25);
  }
}

.hero-row, .hero-back, .hero-title, .hero-col, .hero-actions,
.hero-tool, .hero-code, .hero-meta { position: relative; z-index: 1; }

.hero-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}
.hero-row--top { margin-bottom: var(--space-md); gap: 20px; }
.hero-row--main { justify-content: space-between; flex-wrap: wrap; row-gap: var(--space-sm); }

.hero-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  margin: 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  font-size: var(--font-size-sm);
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s;

  &:hover { color: #fff; text-decoration: underline; }
  .el-icon { font-size: 16px; }
}

.hero-title {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
}
.hero-no {
  font-family: Menlo, Consolas, monospace;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.hero-status { flex-shrink: 0; }

.hero-col { display: flex; flex-direction: column; gap: 4px; }
.hero-col--meta { gap: 2px; }

.hero-tool { font-size: 20px; font-weight: 600; }
.hero-code {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: Menlo, Consolas, monospace;
  font-size: 13px;
  opacity: 0.88;
}
.hero-model { opacity: 0.7; font-family: inherit; }

.hero-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  &__label { opacity: 0.75; }
  &__value { font-weight: 500; }
}

.hero-actions {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  position: relative; z-index: 1;
}

// ========= Steps =========
.steps-card { padding: 28px 32px; }

// ========= 信息卡片 grid（宽屏单列大卡） =========
.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
}

.info-card {
  padding: 28px 32px;
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-lg);
}
.section-title__icon {
  width: 32px; height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(64, 158, 255, 0.12);
  color: var(--color-primary);
  font-size: 16px;
}

// ========= KV 列表（两行间距 + 虚线分隔 + 两端对齐） =========
.kv-list {
  display: grid;
  gap: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 32px;
}
.kv-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) 0;
  border-bottom: 1px dashed var(--border-lighter);
  min-height: 40px;
}
.kv-item--full { grid-column: 1 / -1; align-items: flex-start; }
.kv-label {
  color: var(--text-secondary);
  font-size: 14px;
  flex-shrink: 0;
}
.kv-value {
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.6;
  text-align: right;
  word-break: break-all;
  flex: 1;
  min-width: 0;
}
.kv-item--full .kv-value { text-align: left; }

.kv-value--desc { white-space: pre-wrap; line-height: 1.7; }

.mono { font-family: Menlo, Consolas, monospace; }
.money { color: var(--color-danger); font-weight: 700; font-size: 15px; }
.muted { color: var(--text-secondary); font-size: var(--font-size-xs); }

.attachment {
  width: 72px; height: 72px;
  border-radius: var(--radius-sm);
  margin-left: 6px;
  border: 1px solid var(--border-lighter);
}

// ========= 维修历程时间线 =========
.info-section {
  padding: 28px 32px;
  margin-bottom: 0;
}

.log-head {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.log-meta { font-size: var(--font-size-xs); color: var(--text-secondary); }
.log-desc { margin: 0; line-height: 1.7; color: var(--text-regular); }

// ========= 费用 =========
.fee-card { padding: 28px 32px; }
.fee-row {
  display: flex;
  gap: var(--space-lg);
  align-items: flex-start;
  flex-wrap: wrap;
}
.fee-info { flex: 1; min-width: 260px; }
.fee-amount {
  font-size: 32px; font-weight: 700;
  color: var(--color-danger);
  margin-bottom: var(--space-sm);
}
.fee-sub {
  color: var(--text-regular);
  line-height: 1.8;
  margin-bottom: var(--space-md);
  font-size: 14px;
}
.fee-qr { display: flex; flex-direction: column; align-items: center; gap: var(--space-xs); }
.pay-link { font-size: var(--font-size-sm); color: var(--color-primary); text-decoration: none; }
.pay-link:hover { text-decoration: underline; }
.qr-tip { font-size: var(--font-size-xs); color: var(--text-secondary); }

.field-tip {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 4px;
}

// ========= 响应式 =========
@media (max-width: 992px) {
  .kv-list { grid-template-columns: 1fr; column-gap: 0; }
}
@media (max-width: 768px) {
  .hero { padding: var(--space-md); }
  .hero-row--top { flex-wrap: wrap; gap: var(--space-xs); }
  .hero-no { font-size: 18px; }
  .info-card, .steps-card, .info-section, .fee-card { padding: var(--space-md); }
}
</style>
