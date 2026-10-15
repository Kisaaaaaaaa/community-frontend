<template>
  <div class="home-page">
    <!-- 欢迎横幅 -->
    <section class="hero">
      <h1 class="hero-title">欢迎使用社区服务平台</h1>
      <p class="hero-desc">简洁直观的界面设计，适配各年龄段居民使用</p>
      <el-button type="primary" size="large" round class="btn-accessible">
        立即体验
      </el-button>
    </section>

    <!-- 功能卡片：响应式栅格 -->
    <section class="features">
      <h2 class="section-title">便民服务</h2>
      <el-row :gutter="16">
        <el-col
          v-for="item in features"
          :key="item.title"
          :xs="24"
          :sm="12"
          :md="8"
        >
          <div class="feature-card card-box">
            <el-icon :size="40" :color="item.color">
              <component :is="item.icon" />
            </el-icon>
            <h3 class="feature-title">{{ item.title }}</h3>
            <p class="feature-desc">{{ item.desc }}</p>
          </div>
        </el-col>
      </el-row>
    </section>

    <!-- 公告列表 -->
    <section class="notices">
      <h2 class="section-title">社区公告</h2>
      <div class="card-box">
        <el-timeline>
          <el-timeline-item
            v-for="notice in notices"
            :key="notice.id"
            :timestamp="notice.time"
            placement="top"
          >
            <h4>{{ notice.title }}</h4>
            <p class="notice-content">{{ notice.content }}</p>
          </el-timeline-item>
        </el-timeline>
      </div>
    </section>
  </div>
</template>

<script setup>
import {
  Document,
  Calendar,
  Bell,
  Service,
  Tickets,
  Wallet
} from '@element-plus/icons-vue'

// 便民服务功能项
const features = [
  { title: '办事大厅', desc: '在线办理各类社区事务', icon: Document, color: '#409eff' },
  { title: '活动预约', desc: '查看并预约社区活动', icon: Calendar, color: '#67c23a' },
  { title: '通知公告', desc: '及时了解社区动态', icon: Bell, color: '#e6a23c' },
  { title: '物业服务', desc: '在线报修与咨询', icon: Service, color: '#f56c6c' },
  { title: '票务预约', desc: '场馆与设施预约', icon: Tickets, color: '#909399' },
  { title: '生活缴费', desc: '水电气费便捷缴纳', icon: Wallet, color: '#409eff' }
]

// 社区公告示例数据
const notices = [
  { id: 1, time: '2026-10-15', title: '社区秋季运动会报名通知', content: '社区将于下周举办秋季趣味运动会，欢迎各年龄段居民踊跃报名参加。' },
  { id: 2, time: '2026-10-12', title: '物业服务升级公告', content: '为提升服务质量，物业在线报修系统已上线，居民可通过手机随时报修。' },
  { id: 3, time: '2026-10-10', title: '健康义诊活动通知', content: '社区卫生服务中心将于本周六开展免费义诊活动，提供血压、血糖检测。' }
]
</script>

<style lang="scss" scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.hero {
  background: linear-gradient(135deg, var(--color-primary) 0%, #66b1ff 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-xl) var(--space-lg);
  text-align: center;
  color: #fff;

  .hero-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: var(--space-sm);
  }

  .hero-desc {
    font-size: var(--font-size-base);
    margin-bottom: var(--space-md);
    opacity: 0.9;
  }
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--space-md);
  padding-left: var(--space-sm);
  border-left: 4px solid var(--color-primary);
}

.feature-card {
  text-align: center;
  margin-bottom: var(--space-md);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }

  .feature-title {
    font-size: var(--font-size-base);
    margin: var(--space-sm) 0 var(--space-xs);
  }

  .feature-desc {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}

.notice-content {
  font-size: var(--font-size-sm);
  color: var(--text-regular);
  margin-top: var(--space-xs);
  line-height: 1.8;
}

// 移动端适配
.is-mobile {
  .home-page {
    .hero {
      padding: var(--space-lg) var(--space-md);

      .hero-title {
        font-size: 22px;
      }
    }
  }
}
</style>
