# 开发指南 - MacroShockwave

## 🚀 快速开始

### 前置要求

确保已安装以下软件：

```bash
Node.js >= 20.0.0
npm >= 10.0.0
Docker & Docker Compose (可选)
```

### 1. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd frontend && npm install

# 安装后端依赖（待创建）
cd ../backend && npm install

# 安装智能合约依赖（待创建）
cd ../contracts && npm install
```

### 2. 环境变量配置

#### 前端环境变量

创建 `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
VITE_CONTRACT_ADDRESS=0x... # 待部署后填写
```

#### 后端环境变量

创建 `backend/.env`:

```env
NODE_ENV=development
PORT=4000

# 数据库
DATABASE_URL=postgresql://macroshockwave:dev_password_2026@localhost:5432/macroshockwave

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-2026

# 区块链
RPC_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID
PRIVATE_KEY=your-deployer-private-key
CONTRACT_ADDRESS=0x...

# Oracle API Keys
TRADING_ECONOMICS_API_KEY=your-api-key
BINANCE_API_KEY=your-api-key
COINBASE_API_KEY=your-api-key
```

### 3. 启动开发服务

#### 方式 1：使用 Docker（推荐）

```bash
# 启动所有服务
npm run docker:up

# 查看日志
npm run docker:logs

# 停止服务
npm run docker:down
```

访问：
- 前端：http://localhost:3000
- 后端 API：http://localhost:4000
- PostgreSQL：localhost:5432
- Redis：localhost:6379

#### 方式 2：本地启动

**Terminal 1 - 数据库**:
```bash
# 启动 PostgreSQL
docker run -d -p 5432:5432 --name macroshockwave-postgres \
  -e POSTGRES_USER=macroshockwave \
  -e POSTGRES_PASSWORD=dev_password_2026 \
  -e POSTGRES_DB=macroshockwave \
  postgres:15-alpine

# 启动 Redis
docker run -d -p 6379:6379 --name macroshockwave-redis \
  redis:7-alpine
```

**Terminal 2 - 后端**:
```bash
cd backend
npm run dev
# → http://localhost:4000
```

**Terminal 3 - 前端**:
```bash
cd frontend
npm run dev
# → http://localhost:3000
```

**Terminal 4 - 智能合约本地节点**（可选）:
```bash
cd contracts
npx hardhat node
```

---

## 📁 项目结构说明

### 前端结构

```
frontend/
├── src/
│   ├── app/                    # 应用入口
│   │   ├── App.tsx             # 主应用组件
│   │   └── index.css           # 全局样式
│   │
│   ├── pages/                  # 页面组件
│   │   ├── Home/               # 首页（事件列表）
│   │   ├── EventDetail/        # 事件详情
│   │   ├── Portfolio/          # 投资组合
│   │   └── Profile/            # 用户资料
│   │
│   ├── components/             # 通用组件
│   │   ├── ui/                 # UI 基础组件
│   │   ├── layout/             # 布局组件
│   │   └── business/           # 业务组件
│   │
│   ├── stores/                 # 状态管理 (Zustand)
│   │   ├── useUserStore.ts     # 用户状态
│   │   ├── useEventStore.ts    # 事件状态
│   │   └── useBetStore.ts      # 下注状态
│   │
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useLuffa.ts         # Luffa SDK 集成 ✅
│   │   ├── useContract.ts      # 合约交互
│   │   └── useWebSocket.ts     # 实时数据
│   │
│   ├── services/               # 服务层
│   │   ├── api/                # API 调用
│   │   ├── contract/           # 合约交互
│   │   └── luffa/              # Luffa 集成
│   │
│   ├── utils/                  # 工具函数
│   │   ├── format.ts           # 格式化
│   │   ├── calculate.ts        # 计算
│   │   └── constants.ts        # 常量
│   │
│   └── types/                  # 类型定义
│       ├── event.ts
│       ├── bet.ts
│       └── user.ts
│
├── public/                     # 静态资源
├── index.html                  # HTML 模板
├── vite.config.ts              # Vite 配置
├── tailwind.config.js          # Tailwind 配置
└── package.json
```

### 后端结构（待创建）

```
backend/
├── src/
│   ├── modules/                # 功能模块
│   │   ├── events/             # 事件管理
│   │   ├── bets/               # 下注管理
│   │   ├── users/              # 用户管理
│   │   ├── settlement/         # 结算服务
│   │   └── oracle/             # Oracle 服务
│   │
│   ├── common/                 # 通用模块
│   ├── config/                 # 配置
│   ├── jobs/                   # 定时任务
│   └── utils/                  # 工具函数
│
├── prisma/                     # Prisma ORM
│   └── schema.prisma           # 数据库模型
│
└── test/                       # 测试
```

### 智能合约结构（待创建）

```
contracts/
├── contracts/
│   ├── core/                   # 核心合约
│   │   ├── MacroShockwave.sol  # 主合约
│   │   └── BettingPool.sol     # 奖金池合约
│   │
│   └── oracle/                 # Oracle 合约
│       ├── DataOracle.sol
│       └── PriceOracle.sol
│
├── scripts/                    # 部署脚本
├── test/                       # 合约测试
└── hardhat.config.ts
```

---

## 🛠️ 开发流程

### 创建新页面

1. 在 `frontend/src/pages/` 创建页面文件夹
2. 创建 `index.tsx` 和相关组件
3. 在 `App.tsx` 添加路由

示例：
```typescript
// frontend/src/pages/NewPage/index.tsx
export default function NewPage() {
  return (
    <div className="p-4">
      <h1>New Page</h1>
    </div>
  );
}

// frontend/src/app/App.tsx
import NewPage from '@/pages/NewPage';

<Route path="new-page" element={<NewPage />} />
```

### 创建 API 服务

```typescript
// frontend/src/services/api/example.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const exampleApi = {
  getData: async () => {
    const { data } = await axios.get(`${API_URL}/api/example`);
    return data;
  },
};
```

### 创建 Zustand Store

```typescript
// frontend/src/stores/useExampleStore.ts
import { create } from 'zustand';

interface ExampleState {
  data: string[];
  setData: (data: string[]) => void;
}

export const useExampleStore = create<ExampleState>(set => ({
  data: [],
  setData: data => set({ data }),
}));
```

---

## 🧪 测试

### 前端测试

```bash
cd frontend

# 运行所有测试
npm run test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

### 后端测试

```bash
cd backend

# 单元测试
npm run test

# E2E 测试
npm run test:e2e

# 覆盖率
npm run test:cov
```

### 智能合约测试

```bash
cd contracts

# 运行所有测试
npx hardhat test

# 测试覆盖率
npx hardhat coverage

# Gas 报告
REPORT_GAS=true npx hardhat test
```

---

## 📝 代码规范

### 提交规范（Conventional Commits）

```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
test: 测试相关
chore: 构建/工具链相关

# 示例
git commit -m "feat: 添加事件列表页面"
git commit -m "fix: 修复赔率计算错误"
```

### 代码格式化

```bash
# 格式化所有文件
npm run format

# 仅检查
npm run format:check
```

### Lint

```bash
# 前端 Lint
cd frontend && npm run lint

# 后端 Lint
cd backend && npm run lint

# 自动修复
npm run lint:fix
```

---

## 🔧 常见问题

### 1. Luffa SDK 未找到

**问题**：`Luffa SDK not found`

**解决**：
- 确保在 Luffa 应用中打开小程序
- 检查 `index.html` 中 SDK 脚本是否正确加载

### 2. 数据库连接失败

**问题**：`ECONNREFUSED 127.0.0.1:5432`

**解决**：
```bash
# 检查 PostgreSQL 是否运行
docker ps | grep postgres

# 重启数据库
docker restart macroshockwave-postgres
```

### 3. 端口被占用

**问题**：`Port 3000 is already in use`

**解决**：
```bash
# 查找占用进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或使用其他端口
PORT=3001 npm run dev
```

---

## 📚 相关文档

- [产品需求文档](./PRD_详细版.md)
- [技术架构设计](./技术架构设计.md)
- [开发计划与任务清单](./开发计划与任务清单.md)
- [下注与结算规则](./下注与结算规则详细说明.md)

---

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## ✅ 已完成的工作

- [x] 项目根目录配置
- [x] 前端项目基础结构
- [x] Luffa SDK 集成
- [x] Tailwind CSS 配置
- [x] TypeScript 配置
- [x] Vite 构建配置
- [x] Docker Compose 配置
- [ ] 后端项目结构
- [ ] 智能合约项目结构
- [ ] 数据库 Schema
- [ ] API 接口实现

---

**下一步**：
1. 完成后端项目搭建
2. 创建数据库 Schema
3. 实现核心 API 接口
4. 开发前端页面组件
5. 编写智能合约

**当前进度**: Phase 1 - Week 1 (基础设施搭建中)
