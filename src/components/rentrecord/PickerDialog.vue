<template>
  <el-dialog
    :model-value="visible"
    title="修改取件人"
    width="460px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-if="row" class="picker-info">
      <div class="info-row">
        <span class="info-label">预约单号</span>
        <span class="info-value">{{ row.orderNo }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">工具</span>
        <span class="info-value">{{ row.toolName }}（{{ row.toolCode }}）</span>
      </div>
      <div class="info-row">
        <span class="info-label">当前取件人</span>
        <span class="info-value">{{ row.pickerName || '-' }}</span>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="picker-form">
      <el-form-item label="新取件人" prop="pickerName">
        <el-input v-model="form.pickerName" placeholder="请输入新取件人姓名" maxlength="30" />
      </el-form-item>
      <el-form-item label="联系电话" prop="pickerPhone">
        <el-input v-model="form.pickerPhone" placeholder="请输入新取件人手机号" maxlength="20" />
      </el-form-item>
    </el-form>

    <div class="picker-tip">仅取件前可修改，已取件后不可变更</div>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { updatePicker } from '@/api/rentrecord'

const props = defineProps({
  visible: { type: Boolean, default: false },
  row: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'success'])

const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  pickerName: '',
  pickerPhone: ''
})

const rules = {
  pickerName: [{ required: true, message: '请输入新取件人姓名', trigger: 'blur' }],
  pickerPhone: [
    { required: true, message: '请输入新取件人手机号', trigger: 'blur' },
    { pattern: /^\d{5,20}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

// 打开弹窗时预填当前取件人姓名（接口未返回电话，留空必填）
watch(
  () => props.visible,
  (val) => {
    if (val && props.row) {
      form.pickerName = props.row.pickerName || ''
      form.pickerPhone = ''
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
    await updatePicker(props.row.orderNo, {
      pickerName: form.pickerName,
      pickerPhone: form.pickerPhone
    })
    ElMessage.success('取件人已更新')
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
.picker-info {
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
  width: 90px;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.info-value {
  color: var(--text-primary);
  font-weight: 500;
}

.picker-form {
  padding: 0 4px;
}

.picker-tip {
  margin-top: 4px;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}
</style>
