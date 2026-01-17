import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../lib/api';
import { Portfolio, ApiResponse, PortfolioEvent } from '../lib/types';
import { useLuffa } from '../hooks/useLuffa';
import { LoadingPage } from '../components/ui/Loading';
import { Empty } from '../components/ui/Empty';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  formatAmount,
  formatOdds,
  formatDateTime,
  getEventTypeName,
  getGameModeName,
  getEventStatusName,
} from '../lib/utils';
import { motion } from 'framer-motion';

export function PortfolioPage() {
  const navigate = useNavigate();
  const { isConnected } = useLuffa();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      loadPortfolio();
    } else {
      setLoading(false);
    }
  }, [isConnected]);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = (await usersApi.getPortfolio()) as unknown as ApiResponse<Portfolio>;
      setPortfolio(response.data);
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
        description="连接钱包后即可查看您的投资组合"
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
            onClick={loadPortfolio}
            className="px-4 py-2 bg-primary rounded-lg hover:opacity-90 transition-opacity"
          >
            重试
          </button>
        }
      />
    );
  }

  if (!portfolio || portfolio.totalActiveEvents === 0) {
    return (
      <Empty
        icon="📊"
        title="暂无投资"
        description="您还没有参与任何预测事件"
        action={
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary rounded-lg hover:opacity-90 transition-opacity"
          >
            去下注
          </button>
        }
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">投资组合</h1>
        <p className="text-gray-400">查看您当前的活跃投资</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-400 mb-2">活跃事件</div>
            <div className="text-3xl font-bold text-white">
              {portfolio.totalActiveEvents}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-400 mb-2">总投资金额</div>
            <div className="text-3xl font-bold text-white">
              {formatAmount(portfolio.totalInvested)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-400 mb-2">预估总收益</div>
            <div className="text-3xl font-bold text-success">
              {formatAmount(
                portfolio.events.reduce(
                  (sum, event) =>
                    sum +
                    event.orders.reduce((s, order) => s + order.estimatedWinnings, 0),
                  0
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events */}
      <div className="space-y-6">
        {portfolio.events.map((event, index) => (
          <motion.div
            key={event.eventId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PortfolioEventCard event={event} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PortfolioEventCard({ event }: { event: PortfolioEvent }) {
  const navigate = useNavigate();

  const totalEstimatedWinnings = event.orders.reduce(
    (sum, order) => sum + order.estimatedWinnings,
    0
  );

  return (
    <Card hover onClick={() => navigate(`/events/${event.eventId}`)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{event.eventName}</h3>
            <p className="text-sm text-gray-400">
              {getEventTypeName(event.eventType)} · {formatDateTime(event.releaseTime)}
            </p>
          </div>
          <Badge variant="success">{getEventStatusName(event.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">投资金额</div>
            <div className="text-lg font-bold text-white">
              {formatAmount(event.totalInvested)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">预估收益</div>
            <div className="text-lg font-bold text-success">
              {formatAmount(totalEstimatedWinnings)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {event.orders.map((order) => (
            <div
              key={order.orderId}
              className="p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">
                    {getGameModeName(order.gameMode)}
                  </span>
                  <span className="text-sm font-medium text-white">
                    {order.optionName}
                  </span>
                </div>
                <span className="text-sm font-bold text-primary">
                  {formatOdds(order.currentOdds)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  下注: {formatAmount(order.amount)}
                </span>
                <span className="text-success">
                  预估: {formatAmount(order.estimatedWinnings)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
