# 社区服务平台前端

> 简洁直观的社区服务平台，适配各年龄段居民使用场景，支持 PC 端与移动端访问。

## 技术栈

| 技术 | 说明 |
| --- | --- |
| Vue 3 | 渐进式 JavaScript 框架（Composition API） |
| Vite 5 | 下一代前端构建工具，秒级冷启动 |
| Element Plus | 基于 Vue 3 的组件库，按需自动引入 |
| Vue Router 4 | 官方路由方案 |
| Pinia | 轻量级状态管理 |
| Axios | HTTP 请求库，统一封装拦截器 |
| Sass | CSS 预处理器，模块化管理样式 |

## 功能特性

- **响应式布局**：自动识别 PC / 移动端，PC 端侧边栏导航，移动端抽屉式导航 + 底部 Tab 栏
- **适老化设计**：基础字号 16px 起步，可点击区域不小于 44px，降低操作门槛
- **按需引入**：Element Plus 组件与 API 自动按需注册，减小打包体积
- **统一请求封装**：Axios 拦截器处理 token 注入、错误提示、登录过期跳转
- **路由懒加载**：页面级组件按需加载，提升首屏速度

## 响应式断点

| 断点 | 宽度范围 | 典型设备 |
| --- | --- | --- |
| xs | ≤ 768px | 手机竖屏 |
| sm | ≤ 992px | 手机横屏 / 小平板 |
| md | ≤ 1200px | 平板 |
| lg | > 1200px | 桌面 |

## 项目结构

```
src/
├── api/                # API 请求模块
├── assets/styles/     # 全局样式（变量 / 重置 / 响应式 / 工具类）
├── components/layout/  # 布局组件（Header / Sidebar / 主布局）
├── router/            # 路由配置
├── store/             # Pinia 状态管理
├── utils/             # 工具函数（请求封装 / 响应式监听）
└── views/             # 页面（首页 / 关于 / 404）
```

## 快速开始

### 环境要求

- Node.js >= 16
- npm >= 8（或使用 pnpm / yarn）

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产包
npm run build

# 预览构建结果
npm run preview
```

开发服务器默认运行在 http://localhost:5173/

### 接口代理

开发环境下，以 `/api` 开头的请求会被代理到 `http://localhost:8080`，可在 `vite.config.js` 的 `server.proxy` 中修改后端地址。

## 浏览器支持

- Chrome >= 90
- Edge >= 90
- Safari >= 14
- 移动端 iOS Safari / Android Chrome 最新版

## License

MIT
