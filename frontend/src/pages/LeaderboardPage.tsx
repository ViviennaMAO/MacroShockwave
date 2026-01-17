import { useEffect, useState } from 'react';
import { usersApi } from '../lib/api';
import { LeaderboardEntry, ApiResponse } from '../lib/types';
import { LoadingPage } from '../components/ui/Loading';
import { Empty } from '../components/ui/Empty';
import { Card, CardContent } from '../components/ui/Card';
import { formatAmount, formatPercent, shortenAddress } from '../lib/utils';
import { motion } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';

export function LeaderboardPage() {
  const [type, setType] = useState<'winnings' | 'winRate'>('winnings');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [type]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = (await usersApi.getLeaderboard({
        type,
        limit: 100,
      })) as ApiResponse<LeaderboardEntry[]>;
      setLeaderboard(response.data);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

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
            onClick={loadLeaderboard}
            className="px-4 py-2 bg-primary rounded-lg hover:opacity-90 transition-opacity"
          >
            重试
          </button>
        }
      />
    );
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-gray-500';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">排行榜</h1>
        <p className="text-gray-400">查看顶级预测者的表现</p>
      </div>

      {/* Tabs */}
      <Tabs.Root value={type} onValueChange={(value) => setType(value as any)}>
        <Tabs.List className="flex space-x-2 p-1 rounded-lg bg-white/5 border border-white/10 max-w-md mx-auto">
          <Tabs.Trigger
            value="winnings"
            className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400"
          >
            总收益排行
          </Tabs.Trigger>
          <Tabs.Trigger
            value="winRate"
            className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400"
          >
            胜率排行
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="winnings">
          <LeaderboardList
            entries={leaderboard}
            type="winnings"
            getRankColor={getRankColor}
            getRankEmoji={getRankEmoji}
          />
        </Tabs.Content>

        <Tabs.Content value="winRate">
          <LeaderboardList
            entries={leaderboard}
            type="winRate"
            getRankColor={getRankColor}
            getRankEmoji={getRankEmoji}
          />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  type: 'winnings' | 'winRate';
  getRankColor: (rank: number) => string;
  getRankEmoji: (rank: number) => string | number;
}

function LeaderboardList({
  entries,
  type,
  getRankColor,
  getRankEmoji,
}: LeaderboardListProps) {
  if (entries.length === 0) {
    return (
      <Empty
        title="暂无数据"
        description="还没有用户上榜"
      />
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <motion.div
          key={entry.userId}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card hover>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {/* Rank */}
                  <div className={`text-2xl font-bold ${getRankColor(entry.rank)} min-w-[60px]`}>
                    {getRankEmoji(entry.rank)}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center space-x-3 flex-1">
                    {entry.avatar ? (
                      <img
                        src={entry.avatar}
                        alt={entry.username || 'User'}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary" />
                    )}
                    <div>
                      <div className="font-medium text-white">
                        {entry.username || shortenAddress(entry.address)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {entry.totalBets} 次下注 · {entry.totalWins} 次获胜
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    {type === 'winnings' ? (
                      <>
                        <div className="text-xl font-bold text-success">
                          {formatAmount(entry.totalWinnings)}
                        </div>
                        <div className="text-xs text-gray-400">
                          胜率: {formatPercent(entry.winRate)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xl font-bold text-success">
                          {formatPercent(entry.winRate)}
                        </div>
                        <div className="text-xs text-gray-400">
                          收益: {formatAmount(entry.totalWinnings)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
