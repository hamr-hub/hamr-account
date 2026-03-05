# HamR 账号中心 (account.hamr.store)

HamR 平台的统一账号中心和家庭管理系统。

## 项目信息

- **项目名称**: HamR 账号中心
- **项目编号**: PROJ-003
- **域名**: account.hamr.store
- **技术栈**: 
  - 前端: React + TypeScript + Vite
  - 后端: Rust + Axum + PostgreSQL
- **部署**: 云服务器 + PostgreSQL RDS

## 功能特性

- 用户注册、登录、密码找回
- 家庭创建与成员管理
- SSO 单点登录（OAuth2 + JWT）
- 用户资料管理
- 账号安全设置

## 项目结构

```
hamr-account/
├── frontend/           # React 前端
│   ├── src/
│   └── package.json
└── backend/            # Rust 后端
    ├── src/
    ├── Cargo.toml
    └── .env.example
```

## 开发

### 前端

```bash
cd frontend
npm install
npm run dev
```

### 后端

```bash
cd backend
cargo run
```

## 环境变量

```bash
# backend/.env
DATABASE_URL=postgresql://user:password@localhost/hamr_account
JWT_SECRET=your-secret-key
```

## 相关文档

- [项目文档](../../projects/active/账号中心-20260305.md)
- [API 文档](./docs/api.md)

## License

MIT
