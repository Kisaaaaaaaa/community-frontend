<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    title="归还验收"
    width="560px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-if="row" class="return-info">
      <div class="info-row">
        <span class="info-label">预约单号</span>
        <span class="info-value">{{ row.orderNo }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">工具</span>
        <span class="info-value">{{ row.toolName }}（{{ row.toolCode }}）</span>
      </div>
      <div class="info-row">
        <span class="info-label">租赁人</span>
        <span class="info-value">{{ row.renterName }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">计划归还</span>
        <span class="info-value">{{ row.endTime }}</span>
      </div>
      <div class="info-row" v-if="overdueDays > 0">
        <span class="info-label" style="color: var(--el-color-danger)">预计逾期</span>
        <span class="info-value" style="color: var(--el-color-danger)">
          {{ overdueDays }} 天（系统自动计算：¥{{ autoOverdueFee.toFixed(2) }}）
        </span>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" class="return-form">
      <el-form-item label="归还时间" prop="returnTime">
        <el-date-picker
          v-model="form.returnTime"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm"
          placeholder="选择实际归还时间"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="验收结果" prop="acceptanceResult">
        <el-radio-group v-model="form.acceptanceResult">
          <el-radio
            v-for="item in ACCEPTANCE_RESULT_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="损坏程度" prop="damageLevel">
        <el-select v-model="form.damageLevel" placeholder="请选择" style="width: 100%">
          <el-option
            v-for="item in DAMAGE_LEVEL_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="逾期费用">
        <el-input-number
          v-model="form.overdueFee"
          :min="0"
          :precision="2"
          :step="10"
          controls-position="right"
          placeholder="留空则由系统自动计算"
          style="width: 100%"
        />
        <div class="form-tip">留空时系统将按 20 元/天自动计算（不超过押金 ¥{{ formatAmount(row?.depositAmount) }}）</div>
      </el-form-item>
      <el-form-item label="验收备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="2"
          placeholder="选填，如严重损坏时的赔偿说明"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确认归还
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { confirmReturn } from '@/api/rentrecord'
import { ACCEPTANCE_RESULT_OPTIONS, DAMAGE_LEVEL_OPTIONS, formatAmount } from '@/utils/rentrecord'

const props = defineProps({
  visible: { type: Boolean, default: false },
  row: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'success'])

const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  returnTime: '',
  acceptanceResult: 'INTACT',
  damageLevel: 1,
  overdueFee: undefined,
  remark: ''
})

const rules = {
  returnTime: [{ required: true, message: '请选择归还时间', trigger: 'change' }],
  acceptanceResult: [{ required: true, message: '请选择验收结果', trigger: 'change' }],
  damageLevel: [{ required: true, message: '请选择损坏程度', trigger: 'change' }]
}

// 逾期天数计算（预估）
const overdueDays = computed(() => {
  if (!props.row?.endTime || !form.returnTime) return 0
  const end = new Date(props.row.endTime.replace(' ', 'T'))
  const actual = new Date(form.returnTime.replace(' ', 'T'))
  if (actual <= end) return 0
  const diffMs = actual - end
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
})

// 系统自动计算的逾期费用预估（20元/天，封顶押金）
const autoOverdueFee = computed(() => {
  if (overdueDays.value <= 0) return 0
  const fee = overdueDays.value * 20
  const deposit = Number(props.row?.depositAmount || 0)
  return Math.min(fee, deposit)
})

// 打开弹窗时初始化
watch(
  () => props.visible,
  (val) => {
    if (val) {
      // 默认归还时间为当前时间
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      form.returnTime = `${y}-${m}-${d} ${hh}:${mm}`
      form.acceptanceResult = 'INTACT'
      form.damageLevel = 1
      form.overdueFee = undefined
      form.remark = ''
      formRef.value?.clearValidate()
    }
  }
)

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    await confirmReturn(props.row.orderNo, {
      returnTime: form.returnTime,
      acceptanceResult: form.acceptanceResult,
      damageLevel: form.damageLevel,
      overdueFee: form.overdueFee !== undefined && form.overdueFee !== null ? form.overdueFee : undefined,
      remark: form.remark || undefined
    })
    ElMessage.success('归还验收成功')
    emit('update:visible', false)
    emit('success')
  } catch {
    // 错误由拦截器统一提示
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.return-info {
  background: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);
  padding: 12px 16px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 4px 0;
  font-size: var(--font-size-sm);

  &:not(:last-child) {
    border-bottom: 1px dashed var(--border-lighter);
  }
}

.info-label {
  width: 80px;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.info-value {
  color: var(--text-primary);
  font-weight: 500;
}

.return-form {
  padding: 0 4px;
}

.form-tip {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 4px;
}
</style>
