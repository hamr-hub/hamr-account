# HamR 账号中心 (account.hamr.store)

HamR 平台的身份认证与家庭管理服务。

## 功能

- **用户认证**：注册、登录、Token 刷新、登出
- **个人信息**：查看/修改个人资料、修改密码
- **家庭管理**：创建家庭、通过邀请码加入、查看成员、退出家庭

## 技术栈

| 端 | 技术 |
|----|------|
| 后端 | Rust + Axum + SQLx + PostgreSQL |
| 前端 | React 19 + Tailwind CSS v4 + Zustand |
| 认证 | JWT (jsonwebtoken) + bcrypt |
| 数据库 | PostgreSQL 16 + sqlx-migrate |

## 快速启动

### 使用 Docker Compose（推荐）

```bash
cp .env.example .env
# 修改 .env 中的密码和密钥
docker compose up -d
```

访问：
- 前端：http://localhost:3000
- 后端 API：http://localhost:3001

### 本地开发

**后端**
```bash
cd backend
cp .env.example .env
# 修改 DATABASE_URL 等配置
cargo run
```

**前端**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## API 文档

| 路径 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/v1/auth/register` | POST | 注册 | 无 |
| `/api/v1/auth/login` | POST | 登录 | 无 |
| `/api/v1/auth/refresh` | POST | 刷新 Token | 无 |
| `/api/v1/auth/logout` | POST | 登出 | JWT |
| `/api/v1/auth/me` | GET | 当前用户信息 | JWT |
| `/api/v1/users/profile` | GET/PUT | 个人资料 | JWT |
| `/api/v1/users/password` | PUT | 修改密码 | JWT |
| `/api/v1/families` | GET/POST | 家庭列表/创建 | JWT |
| `/api/v1/families/join` | POST | 通过邀请码加入 | JWT |
| `/api/v1/families/:id/members` | GET | 成员列表 | JWT |
| `/api/v1/families/:id/leave` | POST | 退出家庭 | JWT |
