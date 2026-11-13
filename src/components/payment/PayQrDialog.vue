<template>
  <el-dialog
    :model-value="modelValue"
    title="扫码支付"
    width="560px"
    :close-on-click-modal="false"
    align-center
    @update:model-value="(v) => emit('update:modelValue', v)"
    @opened="draw"
    @closed="clear"
  >
    <div class="qr-panel">
      <el-alert
        v-if="expired"
        type="error"
        :closable="false"
        show-icon
        title="该支付链接已过期，收银台会提示「交易关闭」，请关闭本窗口后重新下单获取新二维码"
        class="qr-expired"
      />
      <div ref="qrBox" class="qr-box"></div>
      <p class="qr-tip">
        请使用<b>手机支付宝</b>扫描上方二维码<br />
        <span class="qr-tip__sub">沙箱环境需用沙箱版支付宝登录沙箱买家账号</span>
      </p>
      <div class="qr-meta-list">
        <div v-if="payNo" class="qr-meta">
          <span>支付单号</span><b>{{ payNo }}</b>
        </div>
        <div v-if="amount" class="qr-meta">
          <span>支付金额</span><b class="amount">¥{{ amount }}</b>
        </div>
        <div v-if="expireTime" class="qr-meta">
          <span>二维码有效期</span><b class="expire">至 {{ expireTime }}</b>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button round @click="copyLink">复制支付链接</el-button>
      <el-button round @click="openLink">在本机打开收银台</el-button>
      <el-button type="primary" round @click="emit('update:modelValue', false)">我已扫码</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { renderQrCode } from '@/utils/qr'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  payUrl: { type: String, default: '' },
  payNo: { type: String, default: '' },
  amount: { type: [Number, String], default: '' },
  expireTime: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const qrBox = ref(null)

// 支付宝收银台链接有效期很短（约 14 分钟），过期后打开只会看到「交易关闭」
const expired = computed(() => {
  if (!props.expireTime) return false
  const ts = new Date(String(props.expireTime).replace(/-/g, '/')).getTime()
  return Number.isFinite(ts) && Date.now() > ts
})

// 收银台链接接近 1000 字符（约 120 个模块），必须用大画布 + L 级纠错才能扫出来
function draw() {
  nextTick(() => {
    if (!props.payUrl) return
    renderQrCode(qrBox.value, props.payUrl, 400, 'L')
  })
}

function clear() {
  if (qrBox.value) qrBox.value.innerHTML = ''
}

async function copyLink() {
  if (!props.payUrl) return
  try {
    await navigator.clipboard.writeText(props.payUrl)
    ElMessage.success('支付链接已复制')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

function openLink() {
  if (props.payUrl) window.open(props.payUrl, '_blank', 'noopener,noreferrer')
}
</script>

<style lang="scss" scoped>
.qr-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) 0 var(--space-base, 12px);
}

.qr-expired {
  width: 100%;
}

.qr-box {
  padding: 14px; // 白边作为二维码静默区，过窄会导致识别失败
  background-color: #fff;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  overflow: hidden;

  // qrcodejs 会同时插入 canvas 与 img（img 仅用于老安卓），
  // 若两者都显示会并排挤成两半，视觉上就是「乱码」，这里只保留 canvas；
  // 同时保持 canvas 原始像素尺寸，避免缩放插值导致边缘发虚
  :deep(canvas) {
    display: block !important;
    width: 400px !important;
    height: 400px !important;
  }

  :deep(img) {
    display: none !important;
  }

  :deep(table) {
    display: none !important;
  }
}

.qr-tip {
  margin: var(--space-sm) 0 0;
  text-align: center;
  font-size: var(--font-size-sm);
  line-height: 1.7;
  color: var(--text-secondary);

  b {
    color: var(--color-primary);
  }

  &__sub {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary, var(--text-secondary));
  }
}

.qr-meta-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qr-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);

  b {
    color: var(--text-primary);
    font-weight: 600;
  }

  .amount {
    color: var(--color-danger);
  }

  .expire {
    color: var(--color-warning, #e6a23c);
  }
}
</style>
