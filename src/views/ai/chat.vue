<template>
  <div class="ai-chat-page">
    <!-- 左侧：历史会话 -->
    <aside class="session-panel card-box" :class="{ show: mobileSessionsOpen }">
      <div class="session-head">
        <h3>历史会话</h3>
        <el-button link type="primary" :icon="Refresh" :loading="sessionsLoading" @click="loadSessions">
          刷新
        </el-button>
      </div>

      <el-button class="new-chat-btn" type="primary" round :icon="Plus" @click="startNewChat">
        新建对话
      </el-button>

      <div class="session-list" v-loading="sessionsLoading">
        <button
          v-for="it in sessions"
          :key="it.sessionId"
          class="session-item"
          :class="{ active: it.sessionId === currentSessionId }"
          @click="selectSession(it.sessionId)"
        >
          <span class="session-title">{{ it.title || '未命名会话' }}</span>
          <span class="session-last">{{ it.lastMessage || '暂无回答' }}</span>
          <span class="session-meta">{{ it.updateTime }} · {{ it.messageCount }} 条</span>
        </button>

        <div v-if="!sessionsLoading && sessions.length === 0" class="session-empty">
          暂无历史会话
        </div>
      </div>
    </aside>

    <!-- 右侧：对话区 -->
    <section class="chat-panel card-box">
      <header class="chat-head">
        <div class="chat-head-left">
          <el-button class="only-mobile" link :icon="Clock" @click="mobileSessionsOpen = true">
            历史
          </el-button>
          <div>
            <h2>{{ currentTitle }}</h2>
            <p>可查询工具资料与租赁规则，也能查询实时可约时段并协助完成预约</p>
          </div>
        </div>
        <el-tag v-if="currentSessionId" round type="info" size="small">会话 #{{ currentSessionId }}</el-tag>
      </header>

      <div ref="messagesRef" class="message-area" v-loading="messagesLoading">
        <!-- 欢迎态 -->
        <div v-if="!messages.length && !messagesLoading" class="welcome">
          <div class="welcome-icon">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <h3>您好，我是社区工具助手</h3>
          <p>可以问我工具的使用方法、安全注意事项、租赁与赔付规则，也可以直接让我帮您查询可约时段并预约工具</p>
          <div class="suggest-list">
            <button v-for="q in SUGGESTS" :key="q" class="suggest-item" @click="askSuggestion(q)">
              {{ q }}
            </button>
          </div>
        </div>

        <!-- 消息气泡 -->
        <div
          v-for="msg in messages"
          :key="msg.msgId"
          class="msg-row"
          :class="msg.role === 'user' ? 'is-user' : 'is-assistant'"
        >
          <div class="bubble">
            <!-- 助手回答按 Markdown 渲染，用户提问保持纯文本 -->
            <div
              v-if="msg.role === 'assistant'"
              class="bubble-text markdown-body"
              v-html="renderMarkdown(msg.content)"
            ></div>
            <div v-else class="bubble-text">{{ msg.content }}</div>

            <!-- 推荐时段：点击即可让 AI 按该时段继续预约 -->
            <div
              v-if="isResident && msg.role === 'assistant' && msg.slots && msg.slots.length"
              class="slot-recommend"
            >
              <div class="slot-recommend-title">
                <el-icon><Clock /></el-icon>
                <span>推荐时段（点击直接选择该时段预约）</span>
              </div>
              <div class="slot-recommend-list">
                <button
                  v-for="slot in msg.slots"
                  :key="slot.key"
                  class="slot-chip"
                  :disabled="sending"
                  @click="chooseSlot(slot)"
                >
                  {{ slot.label }}
                </button>
              </div>
            </div>

            <!-- 知识库来源 -->
            <div v-if="msg.sources && msg.sources.length" class="sources">
              <div class="sources-title">
                <el-icon><Collection /></el-icon>
                参考资料（{{ msg.sources.length }}）
              </div>
              <div v-for="(src, idx) in msg.sources" :key="idx" class="source-item">
                <div class="source-head">
                  <span class="source-name">{{ src.docName }}</span>
                  <el-tag size="small" round type="success">相似度 {{ formatScore(src.score) }}</el-tag>
                </div>
                <p class="source-snippet">{{ src.snippet }}</p>
              </div>
            </div>
          </div>
          <span class="msg-time">{{ msg.createTime }}</span>
        </div>

        <!-- 思考中 -->
        <div v-if="sending" class="msg-row is-assistant">
          <div class="bubble thinking">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            <em>正在检索知识库并生成回答…</em>
          </div>
        </div>
      </div>

      <footer class="chat-input">
        <el-input
          v-model="question"
          type="textarea"
          :rows="2"
          resize="none"
          maxlength="500"
          show-word-limit
          placeholder="请输入您的问题，按 Enter 发送，Shift + Enter 换行"
          @keydown.enter.exact.prevent="send"
        />
        <el-button
          type="primary"
          round
          :icon="Promotion"
          :loading="sending"
          :disabled="!question.trim()"
          @click="send"
        >
          发送
        </el-button>
      </footer>
    </section>

    <!-- 移动端遮罩 -->
    <div v-if="mobileSessionsOpen" class="session-mask" @click="mobileSessionsOpen = false"></div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Clock, Collection, Plus, Promotion, Refresh } from '@element-plus/icons-vue'
import { askAgent, askAi, getChatMessages, getChatSessions } from '@/api/ai'
import { useUserStore } from '@/store/user'
import { renderMarkdown } from '@/utils/markdown'

const SUGGESTS = [
  '冲击电钻怎么更换钻头？',
  '借用工具需要交押金吗？',
  '工具损坏需要怎么赔偿？',
  '使用角磨机有哪些安全注意事项？'
]

const userStore = useUserStore()

const sessions = ref([])
const sessionsLoading = ref(false)
const messages = ref([])
const messagesLoading = ref(false)
const currentSessionId = ref(null)
const currentTitle = ref('AI 问答助手')
const question = ref('')
const sending = ref(false)
const mobileSessionsOpen = ref(false)
const messagesRef = ref(null)

const formatScore = (score) => (typeof score === 'number' ? score.toFixed(2) : '—')

const isResident = computed(() => userStore.role === 'RESIDENT')

// 从 AI 回答中提取「推荐时段」，渲染为可点击的预约快捷入口
const SLOT_HINT_RE =
  /推荐(?:的)?(?:时段|时间)|可选时段|可用时段|可预约时段|空闲时段|以下时段|建议(?:时段|时间)|其他(?:时段|时间)/
const CONFLICT_HINT_RE = /冲突|不可预约|已被预约|已被占用|时间段被占用/
const SLOT_RE =
  /(\d{4}-\d{2}-\d{2})\s*(\d{1,2}:\d{2})\s*(?:~|～|至|—|–|到)\s*(?:(\d{4}-\d{2}-\d{2})\s*)?(\d{1,2}:\d{2})/g

function padTime(text) {
  const [h, m] = text.split(':')
  return `${String(h).padStart(2, '0')}:${m}`
}

function slotTs(text) {
  return new Date(text.replace(' ', 'T')).getTime()
}

function extractSlots(content) {
  const text = String(content || '')
  if (!text) return []
  // 优先只看「推荐时段」之后的内容，避免把用户原本冲突的时间也当成推荐
  let scope = ''
  const hintIndex = text.search(SLOT_HINT_RE)
  if (hintIndex >= 0) scope = text.slice(hintIndex)
  else if (CONFLICT_HINT_RE.test(text)) scope = text
  if (!scope) return []

  const seen = new Set()
  const slots = []
  let match
  SLOT_RE.lastIndex = 0
  while ((match = SLOT_RE.exec(scope))) {
    const startDate = match[1]
    const startTime = padTime(match[2])
    const endDate = match[3] || startDate
    const endTime = padTime(match[4])
    const startText = `${startDate} ${startTime}`
    const endText = `${endDate} ${endTime}`
    const key = `${startText}~${endText}`
    if (seen.has(key)) continue
    if (!(slotTs(endText) > slotTs(startText))) continue
    seen.add(key)
    slots.push({
      key,
      label: startDate === endDate ? `${startText} ~ ${endTime}` : `${startText} ~ ${endText}`,
      startText,
      endText
    })
  }
  return slots.slice(0, 6)
}

// 为助手消息附加推荐时段，历史消息与新回答保持一致
function decorateMessage(msg) {
  if (msg.role !== 'assistant') return msg
  return { ...msg, slots: extractSlots(msg.content) }
}

function chooseSlot(slot) {
  if (sending.value) return
  question.value = `就选 ${slot.startText} ~ ${slot.endText}，请帮我预约`
  send()
}

// 知识类问题（使用说明 / 规则咨询）走知识库问答；预约类操作走预约助手
// 预约助手才带工具调用，能查实时可约时段、推荐替代时段并创建预约
const KB_INTENT_RE =
  /怎么|如何|怎样|为什么|注意事项|安全|规则|说明书|使用说明|操作步骤|教程|赔偿|损坏|报修|维修流程|押金标准|收费标准|需要交|要交|费用标准/

function pickChatApi(text) {
  return KB_INTENT_RE.test(text) ? askAi : askAgent
}

function scrollToBottom() {
  nextTick(() => {
    const el = messagesRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

async function loadSessions(silent = false) {
  if (!silent) sessionsLoading.value = true
  try {
    const data = await getChatSessions({ page: 1, pageSize: 50 })
    sessions.value = data?.list || []
  } catch (e) {
    // 错误提示由 request 拦截器统一处理
  } finally {
    sessionsLoading.value = false
  }
}

async function loadMessages(sessionId) {
  messagesLoading.value = true
  const PAGE_SIZE = 50
  try {
    // 消息按 msgId 正序返回，长会话需取最后一页才能看到最新对话
    const first = await getChatMessages(sessionId, { page: 1, pageSize: PAGE_SIZE })
    let listData = first?.list || []
    const pages = first?.pages || 1
    if (pages > 1) {
      const last = await getChatMessages(sessionId, { page: pages, pageSize: PAGE_SIZE })
      listData = last?.list || listData
    }
    messages.value = listData.map(decorateMessage)
    scrollToBottom()
  } catch (e) {
    messages.value = []
  } finally {
    messagesLoading.value = false
  }
}

async function selectSession(sessionId) {
  if (sessionId === currentSessionId.value) {
    mobileSessionsOpen.value = false
    return
  }
  currentSessionId.value = sessionId
  const hit = sessions.value.find((it) => it.sessionId === sessionId)
  currentTitle.value = hit?.title || 'AI 问答助手'
  mobileSessionsOpen.value = false
  await loadMessages(sessionId)
}

function startNewChat() {
  currentSessionId.value = null
  currentTitle.value = 'AI 问答助手'
  messages.value = []
  question.value = ''
  mobileSessionsOpen.value = false
}

function askSuggestion(text) {
  question.value = text
  send()
}

async function send() {
  const text = question.value.trim()
  if (!text || sending.value) return

  // 乐观插入用户消息
  messages.value.push({
    msgId: `local-${Date.now()}`,
    role: 'user',
    content: text,
    createTime: ''
  })
  question.value = ''
  sending.value = true
  scrollToBottom()

  try {
    const payload = { question: text }
    if (currentSessionId.value) payload.sessionId = currentSessionId.value
    // 预约类问题交给会调用工具的预约助手，才能拿到实时可约时段
    const data = await pickChatApi(text)(payload)

    const isNew = !currentSessionId.value
    currentSessionId.value = data.sessionId
    if (isNew) currentTitle.value = text.slice(0, 100)

    messages.value.push(
      decorateMessage({
        msgId: data.answerId,
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        createTime: data.answerTime
      })
    )
    await loadSessions(true)
    scrollToBottom()
  } catch (e) {
    // 失败时移除乐观消息，避免界面出现无回答的孤立提问
    const last = messages.value[messages.value.length - 1]
    if (last?.msgId?.toString().startsWith('local-')) messages.value.pop()
    question.value = text
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  await loadSessions()
  if (sessions.value.length) {
    const first = sessions.value[0]
    currentSessionId.value = first.sessionId
    currentTitle.value = first.title || 'AI 问答助手'
    await loadMessages(first.sessionId)
  }
})
</script>

<style lang="scss" scoped>
.ai-chat-page {
  display: flex;
  gap: 0;
  height: calc(100vh - var(--header-height));
  min-height: 560px;
}

/* ---------------- 左侧会话栏 ---------------- */
.session-panel {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  overflow: hidden;
  // 与左侧系统侧边栏无缝贴合
  border-radius: 0;
  box-shadow: none;
  border-right: 1px solid var(--border-lighter);
}

.session-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: var(--font-size-base);
    color: var(--text-primary);
  }
}

.new-chat-btn {
  width: 100%;
}

.session-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.session-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-lighter);
  border-radius: var(--radius-md);
  background-color: transparent;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    background-color: rgba(64, 158, 255, 0.04);
  }

  &.active {
    border-color: var(--color-primary);
    background-color: rgba(64, 158, 255, 0.1);
  }

  .session-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .session-last {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .session-meta {
    font-size: var(--font-size-xs);
    color: var(--text-placeholder);
  }
}

.session-empty {
  padding: var(--space-lg) 0;
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

/* ---------------- 右侧对话区 ---------------- */
.chat-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  // 铺满内容区，去掉卡片圆角与投影
  border-radius: 0;
  box-shadow: none;
}

.chat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-lighter);

  h2 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  p {
    margin: 4px 0 0;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }
}

.chat-head-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}

.message-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-lg);
  background-color: #f7f9fc;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* 欢迎态 */
.welcome {
  margin: auto;
  max-width: 520px;
  text-align: center;

  .welcome-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto var(--space-md);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 26px;
    background: linear-gradient(135deg, var(--color-primary) 0%, #7fbaff 100%);
  }

  h3 {
    margin: 0 0 var(--space-sm);
    font-size: var(--font-size-lg);
    color: var(--text-primary);
  }

  p {
    margin: 0 0 var(--space-lg);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1.7;
  }
}

.suggest-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.suggest-item {
  padding: 10px 14px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background-color: var(--card-bg-color);
  font-size: var(--font-size-sm);
  color: var(--text-regular);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background-color: rgba(64, 158, 255, 0.05);
  }
}

/* 消息气泡 */
.msg-row {
  display: flex;
  flex-direction: column;
  max-width: 78%;

  &.is-user {
    align-self: flex-end;
    align-items: flex-end;

    .bubble {
      background: linear-gradient(135deg, var(--color-primary) 0%, #7fbaff 100%);
      color: #fff;
      border-radius: var(--radius-lg) var(--radius-sm) var(--radius-lg) var(--radius-lg);
    }
  }

  &.is-assistant {
    align-self: flex-start;
    align-items: flex-start;

    .bubble {
      background-color: var(--card-bg-color);
      color: var(--text-regular);
      border: 1px solid var(--border-lighter);
      border-radius: var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg);
    }
  }
}

.bubble {
  padding: 12px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.bubble-text {
  font-size: var(--font-size-sm);
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 助手回答的 Markdown 样式 */
.markdown-body {
  white-space: normal;

  :deep(p) {
    margin: 0 0 8px;
  }
  :deep(p:last-child) {
    margin-bottom: 0;
  }
  :deep(strong) {
    font-weight: 600;
    color: var(--text-primary);
  }
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 12px 0 6px;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }
  :deep(ul),
  :deep(ol) {
    margin: 6px 0;
    padding-left: 20px;
  }
  :deep(li) {
    margin: 2px 0;
  }
  :deep(code) {
    padding: 1px 5px;
    border-radius: 4px;
    background-color: rgba(64, 158, 255, 0.1);
    color: var(--color-primary);
    font-family: Consolas, Monaco, 'Courier New', monospace;
    font-size: 0.92em;
  }
  :deep(pre) {
    margin: 8px 0;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    background-color: #f5f7fa;
    overflow-x: auto;
  }
  :deep(pre code) {
    padding: 0;
    background: transparent;
    color: var(--text-regular);
  }
  :deep(hr) {
    margin: 12px 0;
    border: none;
    border-top: 1px solid var(--border-lighter);
  }
  :deep(a) {
    color: var(--color-primary);
    text-decoration: none;
  }
  :deep(a:hover) {
    text-decoration: underline;
  }
}

/* 推荐时段卡片 */
.slot-recommend {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px dashed rgba(64, 158, 255, 0.45);
  background-color: rgba(64, 158, 255, 0.06);
}

.slot-recommend-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-primary);
}

.slot-recommend-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.slot-chip {
  padding: 6px 12px;
  border: 1px solid var(--color-primary);
  border-radius: 999px;
  background-color: var(--card-bg-color);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    color: #fff;
    background-color: var(--color-primary);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

.msg-time {
  margin-top: 4px;
  font-size: var(--font-size-xs);
  color: var(--text-placeholder);
}

/* 来源引用 */
.sources {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--border-base);
}

.sources-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-primary);
}

.source-item {
  padding: 8px 10px;
  margin-bottom: 8px;
  border-radius: var(--radius-sm);
  background-color: rgba(64, 158, 255, 0.05);

  &:last-child {
    margin-bottom: 0;
  }
}

.source-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.source-name {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-primary);
}

.source-snippet {
  margin: 6px 0 0;
  font-size: var(--font-size-xs);
  line-height: 1.7;
  color: var(--text-secondary);
}

/* 思考中动画 */
.thinking {
  display: flex;
  align-items: center;
  gap: 6px;

  em {
    font-style: normal;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--color-primary);
    animation: blink 1.2s infinite ease-in-out;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes blink {
  0%, 80%, 100% {
    opacity: 0.2;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

/* 输入区 */
.chat-input {
  display: flex;
  align-items: flex-end;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border-lighter);

  :deep(.el-textarea__inner) {
    font-size: var(--font-size-sm);
  }

  .el-button {
    flex-shrink: 0;
    height: 40px;
    margin-bottom: 18px;
  }
}

.only-mobile {
  display: none;
}

.session-mask {
  display: none;
}

/* 响应式 */
@media (max-width: 900px) {
  .ai-chat-page {
    height: calc(100vh - var(--header-height) - 56px);
    // 移动端高度有限，避免固定最小高度把输入区顶到下方导航栏之下
    min-height: 0;
  }

  .only-mobile {
    display: inline-flex;
  }

  .session-panel {
    display: none;
  }

  .session-panel.show {
    display: flex;
    position: fixed;
    top: var(--header-height);
    left: 0;
    bottom: 56px;
    width: 76%;
    max-width: 320px;
    z-index: 1201;
    border-radius: 0;
  }

  .session-mask {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 1200;
    background-color: rgba(0, 0, 0, 0.35);
  }

  .msg-row {
    max-width: 90%;
  }

  .chat-head p {
    display: none;
  }
}
</style>
