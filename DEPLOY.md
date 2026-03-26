# HamR 账号中心 - 部署指南

> 技术栈：Rust + Axum（后端）| React + TypeScript + Vite（前端）| PostgreSQL 16
> 维护：2026-03-26

---

## 快速启动（本地开发 / 测试环境）

### 前置条件

- Docker >= 24.0
- Docker Compose >= 2.20
- （可选）Rust 1.83+，Node.js 20+（如需本地非 Docker 运行）

### 1. 克隆并进入目录

```bash
git clone <repo-url>
cd hamr-account
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example .env

# 编辑 .env，至少修改以下两个字段：
# DB_PASSWORD=your-secure-password
# JWT_SECRET=your-long-random-secret-at-least-32-chars
```

### 3. 启动所有服务

```bash
docker-compose up --build
```

> 首次启动时 Docker 会构建镜像（约 3-5 分钟，Rust 编译较慢），后续启动只需 `docker-compose up`。

服务启动后：

| 服务 | 地址 |
|------|------|
| 前端界面 | http://localhost:3000 |
| 后端 API | http://localhost:3001 |
| PostgreSQL | localhost:5432（仅本地调试用） |

### 4. 停止服务

```bash
docker-compose down          # 停止并删除容器（保留数据库 volume）
docker-compose down -v       # 停止并清空所有数据（含数据库）
```

---

## 环境变量说明

### 根目录 `.env`（docker-compose 读取）

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DB_PASSWORD` | `changeme` | PostgreSQL 密码，**生产必须修改** |
| `JWT_SECRET` | `change-me-in-production` | JWT 签名密钥，**生产必须修改**，建议 32 位以上随机字符串 |
| `JWT_EXPIRES_IN` | `86400` | Access Token 有效期（秒），默认 24 小时 |
| `REFRESH_TOKEN_EXPIRES_IN` | `2592000` | Refresh Token 有效期（秒），默认 30 天 |
| `PORT` | `3001` | 后端监听端口 |
| `RUST_LOG` | `info` | 后端日志级别（trace/debug/info/warn/error） |
| `API_URL` | `http://localhost:3001` | 前端构建时注入的 API 地址 |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS 允许的来源，逗号分隔。生产示例：`https://account.hamr.store` |

### 本地非 Docker 运行（backend/.env）

```bash
# 复制后端独立配置
cp backend/.env.example backend/.env
# 修改 DATABASE_URL 指向本地 PostgreSQL
```

---

## 测试账号（首次部署后手动注册）

系统无预置测试账号，请通过前端注册页面创建：

| 字段 | 建议值（测试用） |
|------|-----------------|
| 邮箱 | test@hamr.local |
| 用户名 | testuser |
| 密码 | Test1234! |
| 显示名称 | 测试用户 |

> 注意：`email_verified` 字段默认为 `false`，当前版本无邮箱验证流程，不影响登录使用。

---

## API 端点列表

### 公开接口（无需认证）

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| `POST` | `/api/v1/auth/register` | 用户注册 | `{email, username, password, display_name?}` |
| `POST` | `/api/v1/auth/login` | 用户登录 | `{email, password}` |
| `POST` | `/api/v1/auth/refresh` | 刷新 Token | `{refresh_token}` |

### 认证接口（需携带 Bearer Token）

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| `POST` | `/api/v1/auth/logout` | 登出 | `{refresh_token}` |
| `GET` | `/api/v1/auth/me` | 获取当前用户信息 | - |
| `GET` | `/api/v1/users/profile` | 获取用户资料 | - |
| `PUT` | `/api/v1/users/profile` | 更新用户资料 | `{display_name?, avatar_url?}` |
| `PUT` | `/api/v1/users/password` | 修改密码 | `{old_password, new_password}` |
| `POST` | `/api/v1/families` | 创建家庭 | `{name, description?}` |
| `GET` | `/api/v1/families` | 获取我的家庭列表 | - |
| `POST` | `/api/v1/families/join` | 通过邀请码加入家庭 | `{invite_code}` |
| `GET` | `/api/v1/families/:id/members` | 获取家庭成员列表 | - |
| `POST` | `/api/v1/families/:id/leave` | 退出家庭 | - |

### 认证方式

所有需要认证的接口，在请求头中携带：

```
Authorization: Bearer <access_token>
```

### 响应格式

成功响应（注册/登录/刷新）：

```json
{
  "access_token": "eyJ...",
  "refresh_token": "550e8400-...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "display_name": "显示名称",
    "avatar_url": null,
    "email_verified": false,
    "created_at": "2026-03-26T00:00:00Z"
  }
}
```

错误响应：

```json
{
  "error": "错误描述",
  "status": 422
}
```

---

## 数据库迁移

迁移脚本由 sqlx-migrate 管理，**后端启动时自动执行**，无需手动操作。

迁移文件位置：`backend/migrations/`

| 文件 | 说明 |
|------|------|
| `20260310000001_init.sql` | 初始化表结构（users/families/family_members/refresh_tokens）及索引 |

如需手动执行：

```bash
# 在 backend/ 目录下
DATABASE_URL=postgresql://hamr:changeme@localhost:5432/hamr_account \
  cargo sqlx migrate run
```

---

## 生产部署注意事项

1. **JWT_SECRET**：使用至少 32 位随机字符串，可用 `openssl rand -hex 32` 生成
2. **DB_PASSWORD**：使用强密码，生产数据库不对外暴露 5432 端口
3. **ALLOWED_ORIGINS**：仅填写实际前端域名，禁止使用通配符 `*`
4. **HTTPS**：前端 Nginx 容器前应部署 SSL 终止代理（如 Nginx、Traefik、Cloudflare Tunnel）
5. **数据备份**：定期备份 `postgres_data` Docker volume

---

## 常见问题

**Q: 后端启动失败，提示 `DATABASE_URL must be set`**  
A: 确保 `.env` 文件存在且包含 `DATABASE_URL`（或 `DB_PASSWORD`）。

**Q: 前端无法请求后端 API（CORS 错误）**  
A: 检查 `ALLOWED_ORIGINS` 是否包含前端访问的域名和端口。

**Q: `docker-compose up` 后前端显示空白**  
A: 前端是 React SPA，刷新后由 Nginx 处理路由（`try_files $uri /index.html`），确保 Nginx 配置正确。

**Q: 修改密码后页面没有跳转**  
A: 正常行为——修改密码后前端会清空 Token 并自动跳转到登录页（`/login`）。

---

_最后更新：2026-03-26_
