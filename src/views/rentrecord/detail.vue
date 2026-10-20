<template>
  <div v-loading="loading" class="record-detail-page">
    <!-- 左上角返回 -->
    <div v-if="record" class="back-row">
      <el-button link type="primary" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
    </div>
    <div v-if="record" class="detail-wrap">
      <!-- 状态主视觉 -->
      <div class="hero" :class="heroClass">
        <div class="hero__top">
          <el-tag class="hero__status" effect="dark" round>
            {{ recordStatusLabel(record.status) }}
          </el-tag>
          <el-tag
            v-if="record.overdueFee && Number(record.overdueFee) > 0"
            class="hero__overdue"
            type="danger"
            effect="light"
            round
          >
            逾期费用 ¥{{ formatAmount(record.overdueFee) }}
          </el-tag>
        </div>

        <div class="hero__main">
          <div class="hero__left">
            <div class="hero__name">{{ record.toolName || '工具' }}</div>
            <div class="hero__code">
              <el-icon><Box /></el-icon>
              <span>{{ record.toolCode || '-' }}</span>
            </div>
            <div class="hero__order">
              <span class="label">预约单号</span>
              <span class="value">{{ record.orderNo }}</span>
              <el-icon class="copy" title="复制单号" @click="copyOrderNo"><CopyDocument /></el-icon>
            </div>
          </div>

          <div class="hero__amount">
            <span class="label">押金</span>
            <span class="value">¥{{ formatAmount(record.depositAmount) }}</span>
            <template v-if="record.refundAmount !== undefined">
              <span class="sub">
                退还 ¥{{ formatAmount(record.refundAmount) }}
                <span v-if="record.refundStatus">（{{ refundStatusLabel(record.refundStatus) }}）</span>
              </span>
            </template>
            <span v-else class="sub">租赁中</span>
          </div>
        </div>
      </div>

      <!-- 信息卡 -->
      <div class="info-grid">
        <div class="card-box info-card">
          <h4 class="section-title">
            <span class="section-title__icon"><el-icon><User /></el-icon></span>
            租赁人与取件
          </h4>
          <div class="kv-list">
            <div class="kv-item">
              <span class="kv-label">租赁人</span>
              <span class="kv-value">{{ record.renterName || '-' }}</span>
            </div>
            <div class="kv-item">
              <span class="kv-label">联系方式</span>
              <span class="kv-value">{{ record.renterPhone || '-' }}</span>
            </div>
            <div class="kv-item">
              <span class="kv-label">身份证号</span>
              <span class="kv-value">{{ record.renterIdCard || '-' }}</span>
            </div>
            <div class="kv-item">
              <span class="kv-label">取件人</span>
              <span class="kv-value">{{ record.pickerName || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="card-box info-card">
          <h4 class="section-title">
            <span class="section-title__icon"><el-icon><Clock /></el-icon></span>
            租赁时段
          </h4>
          <div class="kv-list">
            <div class="kv-item">
              <span class="kv-label">计划开始</span>
              <span class="kv-value">{{ record.startTime || '-' }}</span>
            </div>
            <div class="kv-item">
              <span class="kv-label">计划结束</span>
              <span class="kv-value">{{ record.endTime || '-' }}</span>
            </div>
            <div class="kv-item">
              <span class="kv-label">实际归还</span>
              <span class="kv-value">{{ record.actualReturnTime || '—' }}</span>
            </div>
            <div class="kv-item">
              <span class="kv-label">逾期状态</span>
              <span class="kv-value">
                <el-tag v-if="record.overdueStatus" :type="record.overdueStatus === 'YES' ? 'danger' : 'success'" size="small">
                  {{ overdueStatusLabel(record.overdueStatus) }}
                </el-tag>
                <span v-else>-</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 验收结果（归还后才有） -->
      <div v-if="record.acceptanceResult" class="card-box info-card">
        <h4 class="section-title">
          <span class="section-title__icon"><el-icon><Checked /></el-icon></span>
          归还验收
        </h4>
        <div class="kv-list kv-list--inline">
          <div class="kv-item">
            <span class="kv-label">验收结果</span>
            <span class="kv-value">
              <el-tag :type="acceptanceResultTag(record.acceptanceResult)" size="small">
                {{ acceptanceResultLabel(record.acceptanceResult) }}
              </el-tag>
            </span>
          </div>
          <div class="kv-item">
            <span class="kv-label">损坏程度</span>
            <span class="kv-value">{{ record.damageLevel ? `${record.damageLevel} 级` : '-' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-label">逾期费用</span>
            <span class="kv-value is-price">¥{{ formatAmount(record.overdueFee || 0) }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-label">退还金额</span>
            <span class="kv-value is-price">¥{{ formatAmount(record.refundAmount || 0) }}</span>
          </div>
        </div>
      </div>

      <!-- 创建与更新 -->
      <div class="card-box info-card">
        <h4 class="section-title">
          <span class="section-title__icon"><el-icon><Document /></el-icon></span>
          操作记录
        </h4>
        <div class="kv-list kv-list--inline">
          <div class="kv-item">
            <span class="kv-label">创建人</span>
            <span class="kv-value">{{ record.creatorName || '-' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-label">创建时间</span>
            <span class="kv-value">{{ record.createTime || '-' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-label">最后操作人</span>
            <span class="kv-value">{{ record.updaterName || '-' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-label">更新时间</span>
            <span class="kv-value">{{ record.updateTime || '-' }}</span>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-else-if="!loading" description="租赁记录不存在">
      <el-button type="primary" @click="goBack">返回</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Box, Checked, Clock, CopyDocument, Document, User } from '@element-plus/icons-vue'
import { getRecordDetail } from '@/api/rentrecord'
import {
  acceptanceResultLabel,
  acceptanceResultTag,
  formatAmount,
  overdueStatusLabel,
  recordStatusLabel,
  recordStatusTag,
  refundStatusLabel
} from '@/utils/rentrecord'

const route = useRoute()
const router = useRouter()

const orderNo = computed(() => String(route.params.orderNo || ''))

const loading = ref(false)
const record = ref(null)

const heroClass = computed(() => `hero--${(record.value?.status || 'none').toLowerCase()}`)

async function loadDetail() {
  if (!orderNo.value) return
  loading.value = true
  try {
    const data = await getRecordDetail(orderNo.value)
    record.value = data?.record || null
  } finally {
    loading.value = false
  }
}

async function copyOrderNo() {
  try {
    await navigator.clipboard.writeText(record.value?.orderNo || '')
    ElMessage.success('预约单号已复制')
  } catch {
    ElMessage.warning('复制失败，请手动选择单号')
  }
}

function goBack() {
  router.back()
}

onMounted(loadDetail)
</script>

<style lang="scss" scoped>
.record-detail-page {
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

  &__overdue {
    background: rgba(245, 108, 108, 0.9) !important;
    color: #fff !important;
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

  &.hero--picked_up,
  &.hero--overdue {
    background: linear-gradient(135deg, #337ecc, #79bbff);
    box-shadow: 0 8px 24px rgba(51, 126, 204, 0.28);
  }
  &.hero--returned {
    background: linear-gradient(135deg, #73767a, #a6a9ad);
    box-shadow: 0 8px 24px rgba(144, 147, 153, 0.28);
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

/* ---------- 左上角返回 ---------- */
.back-row {
  display: flex;

  .el-button {
    align-self: flex-start;
    padding: 0;
    font-size: var(--font-size-base);
  }
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
}
</style>
