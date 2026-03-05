# HamR 账号中心 (account.hamr.store)

> HamR 平台统一身份认证与家庭管理服务

[![Status](https://img.shields.io/badge/status-开发中-yellow)](https://github.com/hamr-hub/hamr-account)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Backend](https://img.shields.io/badge/backend-Rust+Axum-orange)](https://github.com/tokio-rs/axum)
[![Frontend](https://img.shields.io/badge/frontend-React+TypeScript-61dafb)](https://react.dev)

## 📋 项目概述

**项目编号**: PROJ-003  
**域名**: account.hamr.store  
**优先级**: ⭐⭐⭐ 高  
**状态**: 待开发  

HamR 账号中心是平台的身份认证与授权核心，提供 SSO 单点登录、家庭组织管理、安全审计等关键服务。

## 🎯 核心职责

### 1. 用户身份管理
- 用户注册（邮箱验证）
- 用户登录（密码 + 2FA）
- 密码管理（重置/修改/强度验证）
- 个人信息管理

### 2. 家庭组织管理
- 创建/解散家庭
- 邀请成员（邮件/链接）
- 角色权限管理
  - **管理员**: 完全控制权
  - **成员**: 数据查看与编辑
  - **观察者**: 只读权限
- 成员退出/移除

### 3. SSO 单点登录
- OAuth 2.0 + JWT 认证
- 覆盖 `*.hamr.store` 和 `*.hamr.top` 全域名
- 跨服务会话管理
- Token 签发/刷新/撤销

### 4. 会话管理
- 活跃会话列表
- 单设备强制登出
- 全设备登出
- 会话过期管理

### 5. 安全审计
- 登录历史记录
- 异常登录检测（IP/设备/地理位置）
- 双因素认证 (TOTP)
- 安全事件告警

## 🏗️ 系统架构

```
┌─────────────────┐
│   Frontend      │  React + TypeScript
│  (account.*)    │  用户界面
└────────┬────────┘
         │ HTTPS
┌────────▼────────┐
│   Backend       │  Rust + Axum
│   API Server    │  业务逻辑
└────────┬────────┘
         │
    ┌────┴─────┬────────────┬──────────┐
    │          │            │          │
┌───▼───┐  ┌──▼───┐  ┌────▼────┐  ┌──▼───┐
│ Postgre│  │Redis │  │  SMTP   │  │ JWT  │
│   SQL  │  │Cache │  │ Service │  │ Key  │
└────────┘  └──────┘  └─────────┘  └──────┘
```

## 🛠️ 技术栈

### 后端 (backend/)
| 技术 | 用途 | 备注 |
|-----|------|------|
| **Rust** | 编程语言 | 高性能、内存安全 |
| **Axum** | Web 框架 | 异步、类型安全 |
| **SQLx** | 数据库 ORM | 编译时 SQL 检查 |
| **PostgreSQL** | 主数据库 | 用户/家庭数据 |
| **Redis** | 缓存/会话 | Token 黑名单 |
| **bcrypt** | 密码加密 | 工作因子 12 |
| **jsonwebtoken** | JWT 签发 | RS256 算法 |

### 前端 (frontend/)
| 技术 | 用途 | 备注 |
|-----|------|------|
| **React 18** | UI 框架 | TypeScript |
| **Vite** | 构建工具 | 快速开发 |
| **React Router** | 路由管理 | v6 |
| **Axios** | HTTP 客户端 | 拦截器 |
| **Tailwind CSS** | 样式框架 | 响应式 |

## 🚀 快速开始

### 前置要求
- Rust 1.75+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### 后端启动

```bash
cd backend

# 配置环境变量
cp .env.example .env

# 数据库迁移
sqlx migrate run

# 开发模式
cargo run

# 生产构建
cargo build --release
```

后端运行在 `http://localhost:3000`

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

前端运行在 `http://localhost:5173`

## 📦 项目结构

```
hamr-account/
├── backend/                # Rust 后端
│   ├── src/
│   │   ├── main.rs        # 入口文件
│   │   ├── routes/        # 路由定义
│   │   ├── handlers/      # 请求处理
│   │   ├── models/        # 数据模型
│   │   ├── services/      # 业务逻辑
│   │   ├── middleware/    # 中间件
│   │   └── utils/         # 工具函数
│   ├── migrations/        # 数据库迁移
│   ├── Cargo.toml
│   └── .env.example
├── frontend/              # React 前端
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 可复用组件
│   │   ├── hooks/         # 自定义 Hooks
│   │   ├── api/           # API 调用
│   │   └── types/         # TypeScript 类型
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 🔐 安全特性

### 密码安全
- bcrypt 加密（工作因子 12）
- 密码强度验证（最小 8 位，含大小写+数字+特殊字符）
- 登录失败锁定（5 次失败锁定 15 分钟）

### 会话安全
- JWT RS256 非对称加密
- Access Token 有效期 15 分钟
- Refresh Token 有效期 7 天
- Token 黑名单（Redis）

### 通信安全
- 全站 HTTPS (TLS 1.3)
- HSTS 强制 HTTPS
- CSP 内容安全策略
- CORS 跨域控制

### 审计日志
- 所有登录/登出事件
- 敏感操作记录
- IP/UserAgent/地理位置
- 保留 90 天

## 📊 数据库设计

### 核心表
- `users` - 用户基本信息
- `families` - 家庭组织
- `family_members` - 家庭成员关系
- `sessions` - 会话记录
- `audit_logs` - 审计日志
- `two_factor_auth` - 双因素认证

## 🔌 API 端点

### 认证相关
```
POST   /api/auth/register        # 用户注册
POST   /api/auth/login           # 用户登录
POST   /api/auth/logout          # 用户登出
POST   /api/auth/refresh         # 刷新 Token
POST   /api/auth/reset-password  # 重置密码
```

### 用户管理
```
GET    /api/users/me             # 获取当前用户
PATCH  /api/users/me             # 更新用户信息
DELETE /api/users/me             # 删除账号
```

### 家庭管理
```
POST   /api/families             # 创建家庭
GET    /api/families/:id         # 获取家庭信息
PATCH  /api/families/:id         # 更新家庭信息
DELETE /api/families/:id         # 解散家庭
POST   /api/families/:id/invite  # 邀请成员
POST   /api/families/:id/join    # 加入家庭
DELETE /api/families/:id/members/:userId  # 移除成员
```

### 会话管理
```
GET    /api/sessions             # 获取会话列表
DELETE /api/sessions/:id         # 撤销会话
DELETE /api/sessions/all         # 撤销所有会话
```

## 📊 里程碑

- [ ] **2026-03-15**: 需求确认
- [ ] **2026-03-25**: 数据库设计
- [ ] **2026-04-20**: 后端开发
- [ ] **2026-05-05**: 前端开发
- [ ] **2026-05-15**: 测试上线

## 🔗 相关服务

- [HamR 官网](https://hamr.store) - 品牌门户
- [HamR 管家](https://app.hamr.store) - 核心应用
- [API 服务](https://api.hamr.top) - 统一网关
- [帮助中心](https://help.hamr.store) - 用户支持

## 🧪 测试

```bash
# 后端测试
cd backend
cargo test

# 前端测试
cd frontend
npm run test
```

## 📝 环境变量

### 后端 (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost/hamr_account
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@hamr.store
SMTP_PASS=your-password
```

### 前端 (.env)
```env
VITE_API_URL=http://localhost:3000/api
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/NewFeature`)
3. 提交更改 (`git commit -m 'feat: Add NewFeature'`)
4. 推送到分支 (`git push origin feature/NewFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 👥 维护者

**HamR Team** - [GitHub Organization](https://github.com/hamr-hub)

---

**最后更新**: 2026-03-05  
**项目状态**: 待开发  
**部署环境**: https://account.hamr.store (即将上线)
