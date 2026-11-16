<template>
  <div class="home-page">
    <!-- Hero 欢迎横幅：个性化问候 + 时间感知 + 柔和装饰光斑 -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-text">
          <p class="hero-greeting">
            {{ timeGreeting }}，
            <span class="hero-name">{{ displayName }}</span>
          </p>
          <h1 class="hero-title">社区共享工具租赁平台</h1>
          <p class="hero-desc">工具借用、押金缴纳、归还验收、损坏报修，一站式完成</p>
          <div class="hero-meta" v-if="userStore.isLoggedIn">
            <el-tag :type="roleTagType" effect="dark" round>{{ roleLabel }}</el-tag>
            <span class="hero-date">{{ todayText }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 快捷入口：按当前角色展示系统真实可用功能 -->
    <section class="entries">
      <div class="section-header">
        <h2 class="section-title">快捷入口</h2>
        <span class="section-sub">{{ roleLabel }}可用功能</span>
      </div>
      <div class="entry-grid">
        <div
          v-for="item in quickEntries"
          :key="item.title"
          class="entry-card card-box"
          @click="router.push(item.to)"
        >
          <div class="entry-icon" :style="{ background: item.bg }">
            <el-icon :size="26" color="#fff">
              <component :is="item.icon" />
            </el-icon>
          </div>
          <div class="entry-body">
            <h3 class="entry-title">{{ item.title }}</h3>
            <p class="entry-desc">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 服务流程：借用 / 报修两条真实业务链路 -->
    <section class="flows">
      <div class="section-header">
        <h2 class="section-title">服务流程</h2>
        <span class="section-sub">线上留痕，进度可查</span>
      </div>
      <div class="flow-grid">
        <div class="flow-card card-box">
          <div class="flow-head">
            <div class="flow-icon flow-icon--primary">
              <el-icon :size="24" color="#fff"><Box /></el-icon>
            </div>
            <div>
              <h3 class="flow-title">工具借用</h3>
              <p class="flow-sub">从预约到归还验收</p>
            </div>
          </div>
          <ol class="flow-steps">
            <li v-for="(step, index) in rentFlow" :key="step.title">
              <span class="step-index">{{ index + 1 }}</span>
              <div class="step-body">
                <strong>{{ step.title }}</strong>
                <span>{{ step.desc }}</span>
              </div>
            </li>
          </ol>
        </div>

        <div class="flow-card card-box">
          <div class="flow-head">
            <div class="flow-icon flow-icon--warning">
              <el-icon :size="24" color="#fff"><Tools /></el-icon>
            </div>
            <div>
              <h3 class="flow-title">损坏报修</h3>
              <p class="flow-sub">从提交报修到验收上架</p>
            </div>
          </div>
          <ol class="flow-steps">
            <li v-for="(step, index) in repairFlow" :key="step.title">
              <span class="step-index">{{ index + 1 }}</span>
              <div class="step-body">
                <strong>{{ step.title }}</strong>
                <span>{{ step.desc }}</span>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- 租赁须知：平台真实计费与流程规则 -->
    <section class="rules">
      <div class="section-header">
        <h2 class="section-title">租赁须知</h2>
      </div>
      <div class="rule-grid">
        <div v-for="rule in rules" :key="rule.title" class="rule-card card-box">
          <div class="rule-icon" :style="{ color: rule.color, background: rule.bg }">
            <el-icon :size="22"><component :is="rule.icon" /></el-icon>
          </div>
          <div class="rule-body">
            <h4 class="rule-title">{{ rule.title }}</h4>
            <p class="rule-desc">{{ rule.desc }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Bell,
  Box,
  Calendar,
  ChatDotRound,
  Document,
  Files,
  Message,
  Reading,
  Setting,
  Tickets,
  Timer,
  Tools,
  User,
  UserFilled,
  Wallet,
  Warning
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

// 展示名：登录用姓名，未登录用“朋友”
const displayName = computed(() => userStore.realName || '朋友')

// 基于当前时间的问候语
const timeGreeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

// 今日日期文案（含星期）
const todayText = computed(() => {
  const d = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 · ${weekdays[d.getDay()]}`
})

const roleLabel = computed(() => userStore.roleLabel || '访客')
const roleTagType = computed(() => {
  const map = { ADMIN: 'danger', STAFF: 'warning', RESIDENT: 'success' }
  return map[userStore.role] || 'info'
})

// 快捷入口：仅保留系统已实现且当前角色可访问的页面
const ROLE_ENTRIES = {
  RESIDENT: [
    { title: '工具列表', desc: '浏览并预约可借工具', icon: Box, bg: 'linear-gradient(135deg, #409eff, #66b1ff)', to: '/tools' },
    { title: '我的预约', desc: '查看预约与缴费状态', icon: Calendar, bg: 'linear-gradient(135deg, #e6a23c, #ebb563)', to: '/reservations' },
    { title: '我的租赁', desc: '查看租赁与归还记录', icon: Reading, bg: 'linear-gradient(135deg, #67c23a, #85ce61)', to: '/records' },
    { title: '我的报修', desc: '提交与跟踪损坏报修', icon: Warning, bg: 'linear-gradient(135deg, #f56c6c, #f78989)', to: '/repairs' },
    { title: 'AI 问答助手', desc: '咨询工具使用与预约问题', icon: ChatDotRound, bg: 'linear-gradient(135deg, #9b59b6, #bb8fce)', to: '/ai/chat' },
    { title: '我的消息', desc: '接收租赁与报修提醒', icon: Bell, bg: 'linear-gradient(135deg, #13c2c2, #5cdbd3)', to: '/notifications' },
    { title: '个人主页', desc: '管理账号与个人资料', icon: User, bg: 'linear-gradient(135deg, #909399, #a6a9ad)', to: '/profile' }
  ],
  STAFF: [
    { title: '工具列表', desc: '查看与维护工具状态', icon: Box, bg: 'linear-gradient(135deg, #409eff, #66b1ff)', to: '/tools' },
    { title: '预约管理', desc: '处理预约与取件归还', icon: Tickets, bg: 'linear-gradient(135deg, #e6a23c, #ebb563)', to: '/reservations/manage' },
    { title: '租赁管理', desc: '查询租赁记录并导出', icon: Document, bg: 'linear-gradient(135deg, #67c23a, #85ce61)', to: '/records/manage' },
    { title: '报修管理', desc: '核验、维修与验收报修', icon: Tools, bg: 'linear-gradient(135deg, #f56c6c, #f78989)', to: '/repairs/manage' },
    { title: '知识库管理', desc: '维护 AI 问答知识条目', icon: Files, bg: 'linear-gradient(135deg, #9b59b6, #bb8fce)', to: '/ai/kb' },
    { title: '提醒发送记录', desc: '查看系统提醒发送情况', icon: Message, bg: 'linear-gradient(135deg, #13c2c2, #5cdbd3)', to: '/notifications/records' },
    { title: 'AI 问答助手', desc: '解答居民使用与预约问题', icon: ChatDotRound, bg: 'linear-gradient(135deg, #597ef7, #85a5ff)', to: '/ai/chat' },
    { title: '个人主页', desc: '管理账号与个人资料', icon: User, bg: 'linear-gradient(135deg, #909399, #a6a9ad)', to: '/profile' }
  ],
  ADMIN: [
    { title: '工具列表', desc: '查看与维护工具状态', icon: Box, bg: 'linear-gradient(135deg, #409eff, #66b1ff)', to: '/tools' },
    { title: '预约管理', desc: '处理预约与取件归还', icon: Tickets, bg: 'linear-gradient(135deg, #e6a23c, #ebb563)', to: '/reservations/manage' },
    { title: '租赁管理', desc: '查询租赁记录并导出', icon: Document, bg: 'linear-gradient(135deg, #67c23a, #85ce61)', to: '/records/manage' },
    { title: '报修管理', desc: '核验、维修与验收报修', icon: Tools, bg: 'linear-gradient(135deg, #f56c6c, #f78989)', to: '/repairs/manage' },
    { title: '用户管理', desc: '审核与维护系统用户', icon: UserFilled, bg: 'linear-gradient(135deg, #597ef7, #85a5ff)', to: '/admin/users' },
    { title: '知识库管理', desc: '维护 AI 问答知识条目', icon: Files, bg: 'linear-gradient(135deg, #9b59b6, #bb8fce)', to: '/ai/kb' },
    { title: '提醒发送记录', desc: '查看系统提醒发送情况', icon: Message, bg: 'linear-gradient(135deg, #13c2c2, #5cdbd3)', to: '/notifications/records' },
    { title: '提醒配置', desc: '配置租赁与报修提醒规则', icon: Setting, bg: 'linear-gradient(135deg, #fa8c16, #ffc069)', to: '/notifications/config' },
    { title: 'AI 问答助手', desc: '解答居民使用与预约问题', icon: ChatDotRound, bg: 'linear-gradient(135deg, #2f54eb, #597ef7)', to: '/ai/chat' },
    { title: '个人主页', desc: '管理账号与个人资料', icon: User, bg: 'linear-gradient(135deg, #909399, #a6a9ad)', to: '/profile' }
  ]
}

const quickEntries = computed(() => ROLE_ENTRIES[userStore.role] || ROLE_ENTRIES.RESIDENT)

// 借用流程
const rentFlow = [
  { title: '浏览并预约', desc: '查看工具详情与可预约时段，提交租赁预约' },
  { title: '缴纳押金', desc: '预约后 15 分钟内完成支付宝押金支付' },
  { title: '到站取件', desc: '工作人员核验取件人身份后领取工具' },
  { title: '归还验收', desc: '按期归还，验收通过后押金原路退还' }
]

// 报修流程
const repairFlow = [
  { title: '提交报修', desc: '工具归还后在线填写损坏部位与说明' },
  { title: '现场核验', desc: '工作人员确认损坏情况，误报将驳回' },
  { title: '维修处理', desc: '更新维修进度并录入维修费用' },
  { title: '验收上架', desc: '验收合格后工具重新上架可借' }
]

// 租赁须知
const rules = [
  {
    title: '押金与预约',
    desc: '预约创建后请在 15 分钟内完成押金支付，超时预约将自动取消并释放时段。',
    icon: Wallet,
    color: '#409eff',
    bg: 'rgba(64, 158, 255, 0.12)'
  },
  {
    title: '归还与逾期',
    desc: '请按预约时段归还，逾期按「押金 × 10% / 天」计收逾期费，不足 1 天按 1 天计算。',
    icon: Timer,
    color: '#e6a23c',
    bg: 'rgba(230, 162, 60, 0.12)'
  },
  {
    title: '损坏与赔偿',
    desc: '归还验收如判定损坏，将从押金中扣除赔偿；维修费用通过支付宝沙箱支付。',
    icon: Warning,
    color: '#f56c6c',
    bg: 'rgba(245, 108, 108, 0.12)'
  }
]
</script>

<style lang="scss" scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 1080px;
  margin: 0 auto;
}

// ================== Hero 横幅 ==================
.hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--color-primary) 0%, #7fbaff 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-xl) var(--space-lg);
  color: #fff;

  // 装饰光斑（伪元素，不参与 flex 布局）
  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    opacity: 0.2;
    pointer-events: none;
  }

  &::before {
    width: 180px;
    height: 180px;
    background: #fff;
    top: -50px;
    right: -30px;
  }

  &::after {
    width: 120px;
    height: 120px;
    background: #ffd8a8;
    bottom: -40px;
    left: -20px;
    opacity: 0.15;
  }

  .hero-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-lg);
  }

  .hero-text {
    flex: 1;
    min-width: 0;
  }

  .hero-greeting {
    font-size: var(--font-size-lg);
    font-weight: 500;
    margin: 0 0 var(--space-xs);
    opacity: 0.95;

    .hero-name {
      font-weight: 700;
      border-bottom: 2px solid rgba(255, 255, 255, 0.6);
      padding-bottom: 2px;
      margin-left: 4px;
    }
  }

  .hero-title {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 var(--space-xs);
  }

  .hero-desc {
    font-size: var(--font-size-base);
    margin: 0 0 var(--space-md);
    opacity: 0.88;
  }

  .hero-meta {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .hero-date {
    font-size: var(--font-size-sm);
    opacity: 0.85;
    padding: 4px 12px;
    background: rgba(255, 255, 255, 0.18);
    border-radius: 16px;
  }
}

// ================== Section 标题 ==================
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0;
  padding-left: var(--space-sm);
  border-left: 4px solid var(--color-primary);
}

.section-sub {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

// ================== 快捷入口 ==================
.entry-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-md);
}

.entry-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-md);
  cursor: pointer;
  border: 1px solid var(--border-lighter);
  transition: transform 0.22s ease, box-shadow 0.22s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(64, 158, 255, 0.12);
  }

  .entry-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .entry-body {
    flex: 1;
    min-width: 0;
  }

  .entry-title {
    font-size: var(--font-size-base);
    font-weight: 600;
    margin: 0 0 2px;
    color: var(--text-primary);
  }

  .entry-desc {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.5;
  }
}

// ================== 服务流程 ==================
.flow-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-md);
}

.flow-card {
  padding: var(--space-lg);
  border: 1px solid var(--border-lighter);

  .flow-head {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
  }

  .flow-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--primary {
      background: linear-gradient(135deg, #409eff, #66b1ff);
    }

    &--warning {
      background: linear-gradient(135deg, #f56c6c, #f78989);
    }
  }

  .flow-title {
    font-size: var(--font-size-base);
    font-weight: 600;
    margin: 0 0 2px;
    color: var(--text-primary);
  }

  .flow-sub {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin: 0;
  }

  .flow-steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);

    li {
      display: flex;
      align-items: flex-start;
      gap: var(--space-sm);
    }

    .step-index {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(64, 158, 255, 0.12);
      color: var(--color-primary);
      font-size: var(--font-size-sm);
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .step-body {
      display: flex;
      flex-direction: column;
      gap: 2px;

      strong {
        font-size: var(--font-size-base);
        color: var(--text-primary);
        font-weight: 600;
      }

      span {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        line-height: 1.6;
      }
    }
  }
}

// ================== 租赁须知 ==================
.rule-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-md);
}

.rule-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border: 1px solid var(--border-lighter);

  .rule-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .rule-body {
    flex: 1;
    min-width: 0;
  }

  .rule-title {
    font-size: var(--font-size-base);
    font-weight: 600;
    margin: 0 0 4px;
    color: var(--text-primary);
  }

  .rule-desc {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.7;
  }
}

// ================== 响应式 ==================
@media (max-width: 992px) {
  .entry-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .rule-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .home-page {
    gap: var(--space-md);
  }

  .hero {
    padding: var(--space-lg) var(--space-md);
    border-radius: var(--radius-md);

    .hero-content {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-md);
    }

    .hero-title {
      font-size: 22px;
    }

    .hero-greeting {
      font-size: var(--font-size-base);
    }

    &::before { width: 140px; height: 140px; }
    &::after  { width: 100px; height: 100px; }
  }

  .entry-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-sm);
  }

  .entry-card {
    padding: var(--space-sm) var(--space-md);

    .entry-icon {
      width: 38px;
      height: 38px;
    }
  }

  .flow-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-sm);
  }

  .flow-card {
    padding: var(--space-md);
  }

  .rule-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-sm);
  }

  .rule-card {
    padding: var(--space-md);
  }
}
</style>
