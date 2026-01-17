# MacroShockwave Backend API

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 环境变量配置

创建 `.env` 文件：

```env
# 应用配置
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

# 数据库配置
DATABASE_URL=postgresql://macroshockwave:dev_password_2026@localhost:5432/macroshockwave

# Redis 配置
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-2026
JWT_EXPIRATION=7d

# 区块链配置
RPC_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID
PRIVATE_KEY=your-deployer-private-key
CONTRACT_ADDRESS=0x...

# Oracle API Keys
TRADING_ECONOMICS_API_KEY=your-api-key
BINANCE_API_KEY=your-api-key
COINBASE_API_KEY=your-api-key
```

### 数据库初始化

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 查看数据库（可选）
npm run prisma:studio
```

### 启动开发服务器

```bash
npm run dev
```

访问：
- API: http://localhost:4000
- API 文档: http://localhost:4000/api-docs

---

## 📁 项目结构

```
backend/
├── src/
│   ├── modules/                # 功能模块
│   │   ├── events/             # 事件管理 ✅
│   │   │   ├── events.controller.ts
│   │   │   ├── events.service.ts
│   │   │   ├── events.module.ts
│   │   │   └── dto/
│   │   │       └── create-event.dto.ts
│   │   │
│   │   ├── bets/               # 下注管理 🔄
│   │   ├── users/              # 用户管理 🔄
│   │   ├── settlement/         # 结算服务 🔄
│   │   └── oracle/             # Oracle 服务 🔄
│   │
│   ├── common/                 # 公共模块
│   │   ├── prisma/             # Prisma 服务 ✅
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.module.ts
│   │   │
│   │   └── redis/              # Redis 服务 ✅
│   │       ├── redis.service.ts
│   │       └── redis.module.ts
│   │
│   ├── config/                 # 配置
│   ├── jobs/                   # 定时任务
│   ├── utils/                  # 工具函数
│   │
│   ├── app.module.ts           # 主模块 ✅
│   └── main.ts                 # 应用入口 ✅
│
├── prisma/
│   └── schema.prisma           # 数据库模型 ✅
│
├── test/                       # 测试
├── package.json                # 依赖配置 ✅
├── tsconfig.json               # TS 配置 ✅
└── nest-cli.json               # Nest 配置 ✅
```

---

## 📊 数据库设计

### 核心表结构

#### Users (用户表)
```prisma
model User {
  id        String   // UUID
  address   String   // 钱包地址（唯一）
  username  String?  // Luffa 用户名
  avatar    String?  // 头像 URL
  createdAt DateTime
  updatedAt DateTime
}
```

#### Events (事件表)
```prisma
model Event {
  id             String      // UUID
  name           String      // "CPI 2026-02-14"
  type           EventType   // CPI, NFP, GDP, FED_RATE
  releaseTime    DateTime    // 数据发布时间
  consensusValue Decimal?    // 预期值
  publishedValue Decimal?    // 公布值
  tolerance      Decimal?    // 容差
  status         EventStatus // OPEN, BETTING, LOCKED, SETTLING, SETTLED
  settledAt      DateTime?
}
```

#### Pools (奖金池表)
```prisma
model Pool {
  id          String   // UUID
  eventId     String   // 关联事件
  gameMode    GameMode // DATA_SNIPER, VOLATILITY_HUNTER, JACKPOT
  totalAmount Decimal  // 总下注额
}
```

#### Options (选项表)
```prisma
model Option {
  id          String  // UUID
  poolId      String  // 关联奖金池
  name        String  // "鸽派", "风平浪静"
  type        String  // DOVISH, NEUTRAL, HAWKISH, CALM, STORM
  totalAmount Decimal // 该选项总下注额
}
```

#### Orders (订单表)
```prisma
model Order {
  id          String      // UUID
  userId      String      // 用户ID
  eventId     String      // 事件ID
  optionId    String      // 选项ID
  gameMode    GameMode    // 玩法类型
  amount      Decimal     // 下注金额
  winnings    Decimal     // 奖金
  status      OrderStatus // PENDING, CONFIRMED, WON, LOST, REFUNDED
  txHash      String?     // 交易哈希
  confirmedAt DateTime?
  settledAt   DateTime?
}
```

---

## 🔧 已实现功能

### ✅ 事件管理模块 (Events Module)

#### API 端点

**GET /api/events**
- 功能：获取即将发布的事件列表
- 缓存：Redis 30秒
- 响应：包含实时赔率计算

**GET /api/events/:id**
- 功能：获取事件详情
- 响应：包含赔率、倒计时、奖金池信息

**POST /api/events** (管理员)
- 功能：创建新事件
- 自动创建：三个玩法的奖金池和选项

#### 核心逻辑

**赔率计算（Pari-mutuel）**：
```typescript
总奖金池 = 总下注额 × 0.97  // 扣除3%手续费
选项赔率 = 总奖金池 / 该选项下注总额
```

**下注截止时间检查**：
```typescript
下注截止时间 = 数据发布时间 - 5分钟
```

---

## 🔄 待实现功能

### 下注管理模块 (Bets Module)

需要实现：
- [ ] `POST /api/bets` - 创建下注订单
- [ ] `POST /api/bets/:id/confirm` - 确认订单（提交 txHash）
- [ ] `GET /api/bets/:id` - 获取订单详情
- [ ] `GET /api/users/:id/orders` - 获取用户订单列表

核心功能：
- 下注金额验证（10-10,000 USDT）
- 用户限额检查（单事件 50,000 USDT）
- 事件状态验证
- 链上交易验证
- 奖金池实时更新
- WebSocket 推送更新

### 用户管理模块 (Users Module)

需要实现：
- [ ] `GET /api/users/me` - 获取当前用户信息
- [ ] `GET /api/users/me/stats` - 获取用户统计数据
- [ ] `GET /api/users/me/portfolio` - 获取投资组合

### 结算服务 (Settlement Module)

需要实现：
- [ ] Oracle 数据获取
- [ ] 三种玩法的结算逻辑
- [ ] 无人中奖退款机制
- [ ] 批量奖金分配
- [ ] 定时任务调度

### Oracle 服务 (Oracle Module)

需要实现：
- [ ] 数据 Oracle（宏观数据）
- [ ] 价格 Oracle（BTC 价格）
- [ ] 多数据源验证
- [ ] 数据提交到合约

---

## 🎯 开发优先级

### 第1优先级 🔴
1. 下注管理模块
2. 用户管理模块

### 第2优先级 🟡
3. 结算服务
4. Oracle 服务

### 第3优先级 🟢
5. WebSocket 实时推送
6. 定时任务（事件状态自动更新）
7. 数据统计和分析

---

## 📝 API 文档

访问 Swagger 文档：http://localhost:4000/api-docs

### 响应格式

成功响应：
```json
{
  "success": true,
  "data": { ... }
}
```

错误响应：
```json
{
  "success": false,
  "error": "错误信息"
}
```

---

## 🧪 测试

```bash
# 单元测试
npm run test

# E2E 测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

---

## 🔐 安全注意事项

1. **API 密钥管理**
   - 所有密钥必须通过环境变量配置
   - 不要将 `.env` 文件提交到 Git

2. **数据验证**
   - 使用 class-validator 验证所有输入
   - 使用 Prisma 防止 SQL 注入

3. **频率限制**
   - 需要添加 rate limiting 中间件
   - 防止 API 滥用

4. **CORS 配置**
   - 只允许前端域名访问
   - 生产环境需要更严格的配置

---

## 📊 性能优化

### Redis 缓存策略

1. **事件列表** - 缓存 30 秒
2. **事件详情** - 缓存 10 秒
3. **实时赔率** - 通过 WebSocket 推送，不缓存

### 数据库索引

已在 Prisma Schema 中定义：
- `users.address` - 唯一索引
- `events.releaseTime` - 查询索引
- `events.status` - 查询索引
- `orders.userId` - 关联索引
- `orders.eventId` - 关联索引

---

## 🚀 部署

### Docker 部署

```bash
# 构建镜像
docker build -t macroshockwave-backend .

# 运行容器
docker run -p 4000:4000 --env-file .env macroshockwave-backend
```

### 生产环境检查清单

- [ ] 环境变量配置
- [ ] 数据库迁移
- [ ] Redis 连接
- [ ] API 密钥配置
- [ ] CORS 白名单
- [ ] 日志配置
- [ ] 监控配置
- [ ] 备份策略

---

## 📞 需要帮助？

查看相关文档：
- [产品需求文档](../PRD_详细版.md)
- [技术架构设计](../技术架构设计.md)
- [开发计划](../开发计划与任务清单.md)
- [前端开发指南](../frontend/README.md)

---

**当前状态**: Phase 1 - 基础设施完成 ✅ | 核心模块开发中 🔄
