import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../lib/api';
import { UserStats, ApiResponse } from '../lib/types';
import { useLuffa } from '../hooks/useLuffa';
import { LoadingPage } from '../components/ui/Loading';
import { Empty } from '../components/ui/Empty';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  formatAmount,
  formatPercent,
  shortenAddress,
  getOrderStatusName,
  getOrderStatusColor,
  formatDateTime,
} from '../lib/utils';

export function ProfilePage() {
  const navigate = useNavigate();
  const { account, isConnected } = useLuffa();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [isConnected]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = (await usersApi.getStats()) as ApiResponse<UserStats>;
      setStats(response.data);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Empty
        icon="🔐"
        title="请先连接钱包"
        description="连接钱包后即可查看您的个人信息"
      />
    );
  }

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <Empty
        icon="⚠️"
        title="加载失败"
        description={error}
        action={
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-primary rounded-lg hover:opacity-90 transition-opacity"
          >
            重试
          </button>
        }
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            {account?.avatar ? (
              <img
                src={account.avatar}
                alt={account.username || 'User'}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {account?.username || '匿名用户'}
              </h1>
              <p className="text-gray-400">{shortenAddress(account?.address || '')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-400 mb-1">总下注</div>
            <div className="text-2xl font-bold text-white">{stats?.totalBets || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-400 mb-1">胜率</div>
            <div className="text-2xl font-bold text-success">
              {stats?.winRate ? formatPercent(stats.winRate) : '0%'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-400 mb-1">总收益</div>
            <div className="text-2xl font-bold text-white">
              {stats?.profit ? formatAmount(stats.profit) : '$0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-400 mb-1">ROI</div>
            <div className={`text-2xl font-bold ${(stats?.roi || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
              {stats?.roi ? formatPercent(stats.roi) : '0%'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-bold text-white">下注统计</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">总下注金额</span>
              <span className="text-base font-medium text-white">
                {formatAmount(stats?.totalAmount || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">总收益金额</span>
              <span className="text-base font-medium text-success">
                {formatAmount(stats?.totalWinnings || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">活跃订单</span>
              <span className="text-base font-medium text-white">
                {stats?.activeOrders || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold text-white">胜负统计</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">获胜次数</span>
              <span className="text-base font-medium text-success">
                {stats?.totalWins || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">失败次数</span>
              <span className="text-base font-medium text-danger">
                {stats?.totalLosses || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">胜率</span>
              <span className="text-base font-medium text-white">
                {stats?.winRate ? formatPercent(stats.winRate) : '0%'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      {stats?.recentOrders && stats.recentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-bold text-white">最近订单</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentOrders.map((order) => (
              <div
                key={order.id}
                className="p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => navigate(`/events/${order.eventId}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{order.eventName}</span>
                  <Badge
                    variant={
                      order.status === 'WON' ? 'success' :
                      order.status === 'LOST' ? 'danger' :
                      'default'
                    }
                  >
                    {getOrderStatusName(order.status)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{order.optionName}</span>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">
                    下注: {formatAmount(order.amount)}
                  </span>
                  {order.winnings > 0 && (
                    <span className="text-success">
                      收益: {formatAmount(order.winnings)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
