<template>
  <div class="tool-audit-page">
    <!-- 非管理员无权访问 -->
    <div v-if="!isAdmin" class="card-box">
      <el-result icon="warning" title="无访问权限" sub-title="仅管理员可执行工具审核操作">
        <template #extra>
          <el-button type="primary" @click="goBack">返回工具列表</el-button>
        </template>
      </el-result>
    </div>

    <!-- 审核表单 -->
    <div v-else class="card-box audit-card">
      <h3 class="audit-title">工具审核</h3>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="audit-form"
      >
        <el-form-item label="工具编码">
          <el-input :model-value="form.toolCode" disabled />
        </el-form-item>
        <el-form-item label="审核结果" prop="auditStatus">
          <el-radio-group v-model="form.auditStatus">
            <el-radio value="APPROVED">审核通过</el-radio>
            <el-radio value="REJECTED">需修改</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="form.auditStatus === 'REJECTED'"
          label="修改意见"
          prop="auditRemark"
        >
          <el-input
            v-model="form.auditRemark"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="请填写需修改的内容说明（必填）"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            提交审核结果
          </el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { auditTool } from '@/api/tool'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isAdmin = computed(() => userStore.role === 'ADMIN')

const formRef = ref()
const submitting = ref(false)
const form = reactive({
  toolCode: String(route.query.toolCode || ''),
  auditStatus: 'APPROVED',
  auditRemark: ''
})

// 驳回时修改意见必填（与后端校验一致）
const rules = {
  auditStatus: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
  auditRemark: [
    {
      validator: (rule, value, callback) => {
        if (form.auditStatus === 'REJECTED' && !String(value || '').trim()) {
          callback(new Error('审核不通过时修改意见必填'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 提交审核结果
async function handleSubmit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    await auditTool(form.toolCode, {
      auditStatus: form.auditStatus,
      auditRemark: form.auditRemark.trim() || undefined
    })
    ElMessage.success(form.auditStatus === 'APPROVED' ? '审核已通过' : '已提交修改意见')
    goBack()
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.replace('/tools')
}
</script>

<style lang="scss" scoped>
.audit-card {
  max-width: 640px;

  .audit-title {
    margin: 0 0 var(--space-lg);
    font-size: var(--font-size-lg);
    font-weight: 600;
    padding-left: var(--space-sm);
    border-left: 4px solid var(--color-primary);
  }
}

// 移动端适配：标签置顶
.is-mobile {
  .audit-form {
    :deep(.el-form-item__label) {
      text-align: left;
    }
  }
}
</style>
