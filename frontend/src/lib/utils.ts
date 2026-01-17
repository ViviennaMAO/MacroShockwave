import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化金额（USDT）
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * 格式化赔率
 */
export function formatOdds(odds: number): string {
  return `${odds.toFixed(2)}x`;
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

/**
 * 缩短钱包地址
 */
export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * 获取事件类型显示名称
 */
export function getEventTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    CPI: '消费者物价指数',
    NFP: '非农就业数据',
    GDP: '国内生产总值',
    FED_RATE: '美联储利率决议',
  };
  return typeMap[type] || type;
}

/**
 * 获取事件类型图标
 */
export function getEventTypeIcon(type: string): string {
  const iconMap: Record<string, string> = {
    CPI: '📊',
    NFP: '💼',
    GDP: '📈',
    FED_RATE: '🏦',
  };
  return iconMap[type] || '📊';
}

/**
 * 获取玩法显示名称
 */
export function getGameModeName(mode: string): string {
  const modeMap: Record<string, string> = {
    DATA_SNIPER: '数据狙击手',
    VOLATILITY_HUNTER: '波动猎人',
    JACKPOT: '精准点位',
  };
  return modeMap[mode] || mode;
}

/**
 * 获取订单状态显示名称
 */
export function getOrderStatusName(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: '待确认',
    CONFIRMED: '已确认',
    WON: '已获胜',
    LOST: '已失败',
    REFUNDED: '已退款',
  };
  return statusMap[status] || status;
}

/**
 * 获取订单状态颜色
 */
export function getOrderStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    PENDING: 'text-yellow-400',
    CONFIRMED: 'text-blue-400',
    WON: 'text-green-400',
    LOST: 'text-red-400',
    REFUNDED: 'text-gray-400',
  };
  return colorMap[status] || 'text-gray-400';
}

/**
 * 获取事件状态显示名称
 */
export function getEventStatusName(status: string): string {
  const statusMap: Record<string, string> = {
    OPEN: '待开放',
    BETTING: '下注中',
    LOCKED: '已锁定',
    SETTLING: '结算中',
    SETTLED: '已结算',
  };
  return statusMap[status] || status;
}

/**
 * 计算倒计时
 */
export function getCountdown(targetDate: Date | string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
}
