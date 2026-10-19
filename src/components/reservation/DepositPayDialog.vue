<template>
  <el-dialog
    :model-value="modelValue"
    title="缴纳押金"
    width="440px"
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @closed="reset"
  >
    <div v-loading="paying" class="pay-panel">
      <div class="pay-amount">
        <span class="pay-amount__label">应缴押金</span>
        <span class="pay-amount__value">¥{{ formatAmount(depositAmount) }}</span>
      </div>

      <el-descriptions :column="1" border size="large" class="pay-desc">
        <el-descriptions-item label="预约单号">{{ orderNo }}</el-descriptions-item>
        <el-descriptions-item v-if="payBillNo" label="缴费单号">{{ payBillNo }}</el-descriptions-item>
        <el-descriptions-item v-if="payDeadline" label="缴费截止">
          <span class="pay-deadline">{{ payDeadline }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="押金缴纳成功后预约正式生效；超时未缴费预约将自动释放"
        class="pay-tip"
      />

      <div class="pay-channel">
        <span class="pay-channel__label">支付渠道</span>
        <el-radio-group v-model="channel">
          <el-radio value="SANDBOX">支付沙箱（模拟）</el-radio>
        </el-radio-group>
      </div>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">稍后缴纳</el-button>
      <el-button type="primary" :loading="paying" @click="handlePay">确认缴纳</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { payDeposit } from '@/api/reservation'
import { formatAmount } from '@/utils/reservation'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  orderNo: { type: String, default: '' },
  depositAmount: { type: [Number, String], default: 0 },
  payBillNo: { type: String, default: '' },
  payDeadline: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'paid'])

const paying = ref(false)
const channel = ref('SANDBOX')

// 每次打开重置渠道选择
function reset() {
  channel.value = 'SANDBOX'
  paying.value = false
}

// 4.3.4 押金缴纳
async function handlePay() {
  paying.value = true
  try {
    await payDeposit(props.orderNo, { payChannel: channel.value })
    ElMessage.success('押金缴纳成功，预约已生效')
    emit('update:modelValue', false)
    emit('paid')
  } finally {
    paying.value = false
  }
}
</script>

<style lang="scss" scoped>
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

.pay-tip {
  margin-bottom: var(--space-md);
}

.pay-deadline {
  color: var(--color-danger);
  font-weight: 600;
}

.pay-channel {
  display: flex;
  align-items: center;
  gap: var(--space-md);

  &__label {
    color: var(--text-secondary);
  }
}
</style>
