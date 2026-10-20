<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    title="取件确认"
    width="480px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-if="row" class="pickup-info">
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
        <span class="info-label">计划时段</span>
        <span class="info-value">{{ row.startTime }} ~ {{ row.endTime }}</span>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" class="pickup-form">
      <el-form-item label="实际取件人" prop="pickerName">
        <el-input v-model="form.pickerName" placeholder="请输入取件人姓名" maxlength="20" />
      </el-form-item>
      <el-form-item label="核验身份证" prop="checkedIdNo">
        <el-checkbox v-model="form.checkedIdNo">
          已核验取件人身份证或预约单号
        </el-checkbox>
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="2"
          placeholder="选填，如代取说明"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确认取件
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { confirmPickup } from '@/api/rentrecord'

const props = defineProps({
  visible: { type: Boolean, default: false },
  row: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'success'])

const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  pickerName: '',
  checkedIdNo: false,
  remark: ''
})

const rules = {
  pickerName: [{ required: true, message: '请输入取件人姓名', trigger: 'blur' }],
  checkedIdNo: [
    {
      validator: (_, value, cb) => {
        if (!value) cb(new Error('请先核验取件人身份证或预约单号'))
        else cb()
      },
      trigger: 'change'
    }
  ]
}

// 打开弹窗时自动填充默认取件人（租赁人本人）
watch(
  () => props.visible,
  (val) => {
    if (val && props.row) {
      form.pickerName = props.row.pickerName || props.row.renterName || ''
      form.checkedIdNo = false
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
    await confirmPickup(props.row.orderNo, {
      pickerName: form.pickerName,
      checkedIdNo: form.checkedIdNo,
      remark: form.remark || undefined
    })
    ElMessage.success('取件确认成功，工具状态已更新')
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
.pickup-info {
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

.pickup-form {
  padding: 0 4px;
}
</style>
