import { Event } from '../lib/types';
import {
  getEventTypeName,
  getEventTypeIcon,
  getEventStatusName,
  formatDateTime,
  formatAmount,
} from '../lib/utils';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Countdown } from './ui/Countdown';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const totalPool = event.pools.reduce((sum, pool) => sum + pool.totalAmount, 0);
  const isBetting = event.status === 'BETTING';
  const isLocked = event.status === 'LOCKED';
  const isSettled = event.status === 'SETTLED';

  const statusVariant =
    isBetting ? 'success' :
    isLocked ? 'warning' :
    isSettled ? 'default' :
    'primary';

  return (
    <Card hover onClick={onClick} className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="text-3xl">{getEventTypeIcon(event.type)}</div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{event.name}</h3>
              <p className="text-sm text-gray-400">{getEventTypeName(event.type)}</p>
            </div>
          </div>
          <Badge variant={statusVariant}>{getEventStatusName(event.status)}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* 发布时间 */}
          <div>
            <div className="text-sm text-gray-400 mb-1">发布时间</div>
            <div className="text-base font-medium text-white">
              {formatDateTime(event.releaseTime)}
            </div>
          </div>

          {/* 总奖金池 */}
          <div>
            <div className="text-sm text-gray-400 mb-1">总奖金池</div>
            <div className="text-base font-medium text-white">
              {formatAmount(totalPool)}
            </div>
          </div>

          {/* 参与人数 */}
          <div>
            <div className="text-sm text-gray-400 mb-1">预期值</div>
            <div className="text-base font-medium text-white">
              {event.consensusValue ? event.consensusValue.toString() : '-'}
            </div>
          </div>
        </div>

        {/* 倒计时 */}
        {isBetting && (
          <div className="p-4 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">距离下注截止</div>
              <Countdown targetDate={new Date(new Date(event.releaseTime).getTime() - 5 * 60 * 1000)} />
            </div>
          </div>
        )}

        {/* 奖金池预览 */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {event.pools.slice(0, 3).map((pool) => (
            <div
              key={pool.id}
              className="p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="text-xs text-gray-400 mb-1">
                {pool.gameMode === 'DATA_SNIPER' ? '数据狙击手' :
                 pool.gameMode === 'VOLATILITY_HUNTER' ? '波动猎人' :
                 '精准点位'}
              </div>
              <div className="text-sm font-medium text-white">
                {formatAmount(pool.totalAmount)}
              </div>
            </div>
          ))}
        </div>

        {/* 已结算显示结果 */}
        {isSettled && event.publishedValue && (
          <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">公布值</span>
              <span className="text-base font-bold text-white">
                {event.publishedValue}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
