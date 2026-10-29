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
          <h1 class="hero-title">欢迎回到社区服务平台</h1>
          <p class="hero-desc">让每一次生活服务都更便捷、更暖心</p>
          <div class="hero-meta" v-if="userStore.isLoggedIn">
            <el-tag :type="roleTagType" effect="dark" round>{{ roleLabel }}</el-tag>
            <span class="hero-date">{{ todayText }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 便民服务：6 个特色卡片，彩色圆形 icon 背景 + 轻量悬停 -->
    <section class="features">
      <h2 class="section-title">便民服务</h2>
      <div class="feature-grid">
        <div
          v-for="item in features"
          :key="item.title"
          class="feature-card card-box"
          :class="{ 'is-link': item.to }"
          @click="item.to && router.push(item.to)"
        >
          <div class="feature-icon" :style="{ background: item.bg }">
            <el-icon :size="28" color="#fff">
              <component :is="item.icon" />
            </el-icon>
          </div>
          <h3 class="feature-title">{{ item.title }}</h3>
          <p class="feature-desc">{{ item.desc }}</p>
          <span v-if="item.to" class="feature-link">前往 →</span>
        </div>
      </div>
    </section>

    <!-- 社区公告：卡片式列表，替代原 timeline -->
    <section class="notices">
      <div class="section-header">
        <h2 class="section-title">社区公告</h2>
        <span class="section-sub">共 {{ notices.length }} 条</span>
      </div>
      <div class="notice-list">
        <div
          v-for="notice in notices"
          :key="notice.id"
          class="notice-card card-box"
        >
          <div class="notice-date">
            <span class="notice-day">{{ notice.dateLabel.split('/')[1] }}</span>
            <span class="notice-month">{{ notice.dateLabel.split('/')[0] }}月</span>
          </div>
          <div class="notice-body">
            <h4 class="notice-title">{{ notice.title }}</h4>
            <p class="notice-content">{{ notice.content }}</p>
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
  Box,
  Document,
  Calendar,
  Bell,
  Service,
  Tickets,
  Wallet
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getRoleLabel } from '@/utils/auth'

const router = useRouter()
const userStore = useUserStore()

// 展示名：登录用姓名，未登录用"朋友"
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

// 便民服务功能项
// to 留空表示暂不跳转（后端对应页面未接入），已有路由的才加跳转
const features = [
  { title: '工具列表', desc: '便捷工具随取随用', icon: Box,       bg: 'linear-gradient(135deg, #409eff, #66b1ff)', to: '/tools' },
  { title: '办事大厅', desc: '在线办理社区事务', icon: Document,  bg: 'linear-gradient(135deg, #67c23a, #85ce61)', to: '' },
  { title: '活动预约', desc: '预约社区活动场馆', icon: Calendar,   bg: 'linear-gradient(135deg, #e6a23c, #ebb563)', to: '' },
  { title: '物业服务', desc: '在线报修一键响应', icon: Service,    bg: 'linear-gradient(135deg, #f56c6c, #f78989)', to: '' },
  { title: '票务预约', desc: '场馆与设施预订',   icon: Tickets,    bg: 'linear-gradient(135deg, #909399, #a6a9ad)', to: '' },
  { title: '生活缴费', desc: '水电气费便捷缴纳', icon: Wallet,     bg: 'linear-gradient(135deg, #9b59b6, #bb8fce)', to: '' }
]

// 社区公告示例数据
const notices = [
  { id: 1, time: '2026-10-15', dateLabel: '10/15', title: '社区秋季运动会报名通知', content: '社区将于下周举办秋季趣味运动会，欢迎各年龄段居民踊跃报名参加。' },
  { id: 2, time: '2026-10-12', dateLabel: '10/12', title: '物业服务升级公告', content: '为提升服务质量，物业在线报修系统已上线，居民可通过手机随时报修。' },
  { id: 3, time: '2026-10-10', dateLabel: '10/10', title: '健康义诊活动通知', content: '社区卫生服务中心将于本周六开展免费义诊活动，提供血压、血糖检测。' }
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

// ================== 便民服务卡片 ==================
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-md);
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: var(--space-lg);
  text-align: left;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
  border: 1px solid var(--border-lighter);

  &.is-link {
    cursor: pointer;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(64, 158, 255, 0.12);
  }

  .feature-icon {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-sm);
    flex-shrink: 0;
  }

  .feature-title {
    font-size: var(--font-size-base);
    font-weight: 600;
    margin: 0 0 2px;
    color: var(--text-primary);
  }

  .feature-desc {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.6;
  }

  .feature-link {
    font-size: var(--font-size-sm);
    color: var(--color-primary);
    margin-top: var(--space-sm);
    font-weight: 500;
  }
}

// ================== 社区公告卡片 ==================
.notice-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.notice-card {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
  border: 1px solid var(--border-lighter);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
  }

  .notice-date {
    flex-shrink: 0;
    width: 56px;
    text-align: center;
    padding: var(--space-sm) var(--space-xs);
    background: linear-gradient(135deg, var(--color-primary), #66b1ff);
    color: #fff;
    border-radius: var(--radius-md);
    line-height: 1.1;

    .notice-day {
      display: block;
      font-size: 20px;
      font-weight: 700;
    }

    .notice-month {
      display: block;
      font-size: 12px;
      opacity: 0.9;
      margin-top: 2px;
    }
  }

  .notice-body {
    flex: 1;
    min-width: 0;
  }

  .notice-title {
    font-size: var(--font-size-base);
    font-weight: 600;
    margin: 0 0 4px;
    color: var(--text-primary);
  }

  .notice-content {
    font-size: var(--font-size-sm);
    color: var(--text-regular);
    margin: 0;
    line-height: 1.7;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

// ================== 响应式 ==================
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

  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-sm);
  }

  .feature-card {
    padding: var(--space-md);

    .feature-icon {
      width: 44px;
      height: 44px;
    }
  }

  .notice-card {
    padding: var(--space-md);
    gap: var(--space-sm);

    .notice-date { width: 48px; }
    .notice-day { font-size: 18px; }
  }
}
</style>
