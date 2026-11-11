<template>
  <div class="notification-config-page">
    <div class="card-box config-card">
      <div class="config-head">
        <div>
          <h3 class="page-title">提醒配置</h3>
          <p class="page-sub">默认提醒方式：{{ channelModeLabel(config.defaultChannel) }}</p>
        </div>
        <el-button type="primary" :loading="saving" :disabled="loading" @click="handleSave">
          保存配置
        </el-button>
      </div>

      <el-form label-width="110px" class="channel-form">
        <el-form-item label="默认提醒方式">
          <el-radio-group v-model="config.defaultChannel">
            <el-radio-button
              v-for="item in CHANNEL_MODE_OPTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <el-alert
        v-if="config.defaultChannel !== 'IN_APP'"
        title="邮件提醒将发送到接收人在个人资料中填写的邮箱；未填写邮箱的提醒会记为发送失败。"
        type="warning"
        :closable="false"
        show-icon
        class="config-tip"
      />
      <el-alert
        title="租赁到期与取件提醒按提前量触发；逾期与维修完成提醒为即时触发。"
        type="info"
        :closable="false"
        show-icon
        class="config-tip"
      />

      <el-table v-loading="loading" :data="config.items" stripe>
        <el-table-column label="提醒类型" min-width="150">
          <template #default="{ row }">
            <el-tag :type="notifyTypeTag(row.type)" effect="light">
              {{ row.typeName || notifyTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否启用" width="120" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" />
          </template>
        </el-table-column>
        <el-table-column label="提醒方式" min-width="150">
          <template #default>
            <el-tag :type="config.defaultChannel === 'IN_APP' ? 'info' : 'success'" effect="light">
              {{ channelModeLabel(config.defaultChannel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提前提醒时间" min-width="230">
          <template #default="{ row }">
            <div class="advance-cell">
              <el-input-number
                v-model="row.advanceHours"
                :min="0"
                :precision="0"
                :disabled="isImmediate(row.type)"
                controls-position="right"
                style="width: 130px"
              />
              <span>小时</span>
              <span v-if="isImmediate(row.type)" class="immediate-text">即时触发，无需提前</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getNotificationConfig, updateNotificationConfig } from '@/api/notification'
import {
  CHANNEL_MODE_OPTIONS,
  channelModeLabel,
  notifyTypeLabel,
  notifyTypeTag
} from '@/utils/notification'

const IMMEDIATE_TYPES = ['OVERDUE', 'REPAIR_DONE']

const loading = ref(false)
const saving = ref(false)
const config = reactive({
  defaultChannel: 'IN_APP',
  items: []
})

const isImmediate = (type) => IMMEDIATE_TYPES.includes(type)

async function fetchConfig() {
  loading.value = true
  try {
    const data = await getNotificationConfig()
    config.defaultChannel = data?.defaultChannel || 'IN_APP'
    config.items = (data?.items || []).map((item) => ({
      ...item,
      channel: item.channel || config.defaultChannel,
      advanceHours: item.advanceHours ?? 0
    }))
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    const items = config.items.map((item) => ({
      type: item.type,
      enabled: item.enabled,
      channel: config.defaultChannel,
      advanceHours: isImmediate(item.type) ? 0 : item.advanceHours
    }))
    await updateNotificationConfig({ defaultChannel: config.defaultChannel, items })
    ElMessage.success('提醒配置已保存')
    await fetchConfig()
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    saving.value = false
  }
}

onMounted(fetchConfig)
</script>

<style lang="scss" scoped>
.config-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.page-title {
  margin: 0 0 var(--space-xs);
  padding-left: var(--space-sm);
  border-left: 4px solid var(--color-primary);
  font-size: var(--font-size-lg);
  line-height: 1.2;
}

.page-sub {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.config-tip {
  margin-bottom: var(--space-md);
}

.channel-form {
  margin-bottom: var(--space-sm);

  :deep(.el-radio-group) {
    flex-wrap: wrap;
  }
}

.advance-cell {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.immediate-text {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}
</style>
