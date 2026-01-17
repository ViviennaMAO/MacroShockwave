// 事件类型
export enum EventType {
  CPI = 'CPI',
  NFP = 'NFP',
  GDP = 'GDP',
  FED_RATE = 'FED_RATE',
}

// 事件状态
export enum EventStatus {
  OPEN = 'OPEN',
  BETTING = 'BETTING',
  LOCKED = 'LOCKED',
  SETTLING = 'SETTLING',
  SETTLED = 'SETTLED',
}

// 玩法类型
export enum GameMode {
  DATA_SNIPER = 'DATA_SNIPER',
  VOLATILITY_HUNTER = 'VOLATILITY_HUNTER',
  JACKPOT = 'JACKPOT',
}

// 订单状态
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  WON = 'WON',
  LOST = 'LOST',
  REFUNDED = 'REFUNDED',
}

// 事件
export interface Event {
  id: string;
  name: string;
  type: EventType;
  releaseTime: string;
  consensusValue?: number;
  publishedValue?: number;
  tolerance?: number;
  status: EventStatus;
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
  pools: Pool[];
  countdown?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  canBet: boolean;
  odds?: Record<string, Record<string, number>>;
}

// 奖金池
export interface Pool {
  id: string;
  eventId: string;
  gameMode: GameMode;
  totalAmount: number;
  options: Option[];
}

// 选项
export interface Option {
  id: string;
  poolId: string;
  name: string;
  type: string;
  totalAmount: number;
  odds?: number;
}

// 订单
export interface Order {
  id: string;
  eventId: string;
  eventName: string;
  eventType: EventType;
  releaseTime: string;
  gameMode: GameMode;
  optionId: string;
  optionName: string;
  optionType: string;
  amount: number;
  currentOdds: number;
  estimatedWinnings: number;
  actualWinnings: number;
  status: OrderStatus;
  txHash?: string;
  createdAt: string;
  confirmedAt?: string;
  settledAt?: string;
  user?: {
    id: string;
    address: string;
    username?: string;
    avatar?: string;
  };
}

// 用户
export interface User {
  id: string;
  address: string;
  username?: string;
  avatar?: string;
  createdAt: string;
  stats?: UserStats;
}

// 用户统计
export interface UserStats {
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  totalAmount: number;
  totalWinnings: number;
  winRate: number;
  activeOrders?: number;
  profit?: number;
  roi?: number;
  recentOrders?: Order[];
}

// 投资组合
export interface Portfolio {
  totalActiveEvents: number;
  totalInvested: number;
  events: PortfolioEvent[];
}

export interface PortfolioEvent {
  eventId: string;
  eventName: string;
  eventType: EventType;
  releaseTime: string;
  status: EventStatus;
  totalInvested: number;
  orders: PortfolioOrder[];
}

export interface PortfolioOrder {
  orderId: string;
  gameMode: GameMode;
  optionName: string;
  amount: number;
  currentOdds: number;
  estimatedWinnings: number;
}

// 排行榜
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  address: string;
  username?: string;
  avatar?: string;
  totalBets: number;
  totalWins: number;
  totalWinnings: number;
  winRate: number;
}

// API 响应
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  orders: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
