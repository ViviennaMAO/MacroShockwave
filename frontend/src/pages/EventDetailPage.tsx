import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi } from '../lib/api';
import { Event, ApiResponse, GameMode } from '../lib/types';
import { LoadingPage } from '../components/ui/Loading';
import { Empty } from '../components/ui/Empty';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Countdown } from '../components/ui/Countdown';
import { BettingPanel } from '../components/BettingPanel';
import {
  getEventTypeName,
  getEventTypeIcon,
  getEventStatusName,
  formatDateTime,
  formatAmount,
  getGameModeName,
} from '../lib/utils';
import * as Tabs from '@radix-ui/react-tabs';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>(GameMode.DATA_SNIPER);

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = (await eventsApi.getEventDetail(id!)) as unknown as ApiResponse<Event>;
      setEvent(response.data);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (error || !event) {
    return (
      <Empty
        icon="⚠️"
        title="加载失败"
        description={error || '事件不存在'}
        action={
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary rounded-lg hover:opacity-90 transition-opacity"
          >
            返回主页
          </button>
        }
      />
    );
  }

  const totalPool = event.pools.reduce((sum, pool) => sum + pool.totalAmount, 0);
  const isBetting = event.status === 'BETTING';
  const statusVariant =
    isBetting ? 'success' :
      event.status === 'LOCKED' ? 'warning' :
        event.status === 'SETTLED' ? 'default' :
          'primary';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
      >
        <span>←</span>
        <span>返回</span>
      </button>

      {/* Event Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              <div className="text-5xl">{getEventTypeIcon(event.type)}</div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{event.name}</h1>
                <p className="text-gray-400">{getEventTypeName(event.type)}</p>
              </div>
            </div>
            <Badge variant={statusVariant}>{getEventStatusName(event.status)}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-400 mb-1">发布时间</div>
              <div className="text-lg font-medium text-white">
                {formatDateTime(event.releaseTime)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">总奖金池</div>
              <div className="text-lg font-medium text-white">
                {formatAmount(totalPool)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">预期值</div>
              <div className="text-lg font-medium text-white">
                {event.consensusValue ? event.consensusValue.toString() : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">容差</div>
              <div className="text-lg font-medium text-white">
                {event.tolerance ? `±${event.tolerance}` : '-'}
              </div>
            </div>
          </div>

          {/* Countdown */}
          {isBetting && (
            <div className="mt-6 p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                <div className="text-sm text-gray-400">距离下注截止</div>
                <Countdown targetDate={new Date(new Date(event.releaseTime).getTime() - 5 * 60 * 1000)} />
              </div>
            </div>
          )}

          {/* Settled Result */}
          {event.status === 'SETTLED' && event.publishedValue && (
            <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">公布值</span>
                <span className="text-2xl font-bold text-white">
                  {event.publishedValue}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Modes */}
      <Tabs.Root value={selectedGameMode} onValueChange={(value) => setSelectedGameMode(value as GameMode)}>
        <Tabs.List className="flex space-x-2 p-1 rounded-lg bg-white/5 border border-white/10">
          {event.pools.map((pool) => (
            <Tabs.Trigger
              key={pool.gameMode}
              value={pool.gameMode}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 hover:text-white"
            >
              {getGameModeName(pool.gameMode)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {event.pools.map((pool) => (
          <Tabs.Content key={pool.gameMode} value={pool.gameMode} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Betting Panel */}
              <div className="lg:col-span-2">
                <BettingPanel event={event} pool={pool} onBetPlaced={loadEvent} />
              </div>

              {/* Pool Info */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <h3 className="font-bold text-white">奖金池信息</h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">总下注额</div>
                      <div className="text-2xl font-bold text-white">
                        {formatAmount(pool.totalAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">奖金池（扣除3%手续费）</div>
                      <div className="text-xl font-bold text-success">
                        {formatAmount(pool.totalAmount * 0.97)}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <div className="text-xs text-gray-500">
                        平台收取 3% 手续费用于运营维护
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="font-bold text-white">玩法说明</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-400 space-y-2">
                      {pool.gameMode === GameMode.DATA_SNIPER && (
                        <>
                          <p>预测宏观数据将带来鸽派、中性还是鹰派影响。</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>鸽派：数据低于预期</li>
                            <li>中性：数据符合预期（在容差范围内）</li>
                            <li>鹰派：数据高于预期</li>
                          </ul>
                        </>
                      )}
                      {pool.gameMode === GameMode.VOLATILITY_HUNTER && (
                        <>
                          <p>预测数据发布后 15 分钟内 BTC 价格波动幅度。</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>风平浪静：波动 &lt; 2%</li>
                            <li>中等波动：2% ≤ 波动 &lt; 5%</li>
                            <li>暴风：波动 ≥ 5%</li>
                          </ul>
                        </>
                      )}
                      {pool.gameMode === GameMode.JACKPOT && (
                        <>
                          <p>预测数据发布后 30 秒的 BTC 精确价格区间。</p>
                          <p className="text-yellow-400">难度最高，但赔率也最高！</p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}
