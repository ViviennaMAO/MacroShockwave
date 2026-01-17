import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi } from '../lib/api';
import { Event, ApiResponse } from '../lib/types';
import { LoadingPage } from '../components/ui/Loading';
import { Empty } from '../components/ui/Empty';
import { EventCard } from '../components/EventCard';
import { motion } from 'framer-motion';

export function HomePage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = (await eventsApi.getEvents()) as unknown as ApiResponse<Event[]>;
      setEvents(response.data);
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
            onClick={loadEvents}
            className="px-4 py-2 bg-primary rounded-lg hover:opacity-90 transition-opacity"
          >
            重试
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-block px-4 py-1.5 rounded-full bg-success/10 border border-success/20 text-success text-xs font-bold tracking-widest uppercase mb-4"
        >
          ● LIVE
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-7xl font-black tracking-tighter"
        >
          <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            CPI SHOCKWAVE
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-gray-500 max-w-2xl mx-auto font-medium"
        >
          基于宏观经济数据的比特币价格预测市场
        </motion.p>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="text-sm text-gray-400 mb-2">进行中的事件</div>
          <div className="text-3xl font-bold text-white">
            {events.filter((e) => e.status === 'BETTING').length}
          </div>
        </div>
        <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="text-sm text-gray-400 mb-2">总奖金池</div>
          <div className="text-3xl font-bold text-white">
            ${events.reduce((sum, e) => sum + e.pools.reduce((s, p) => s + p.totalAmount, 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="text-sm text-gray-400 mb-2">待发布事件</div>
          <div className="text-3xl font-bold text-white">
            {events.filter((e) => e.status === 'OPEN' || e.status === 'BETTING').length}
          </div>
        </div>
      </motion.div>

      {/* Events List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">即将发布的事件</h2>
        {events.length === 0 ? (
          <Empty
            title="暂无事件"
            description="当前没有可参与的预测事件"
          />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <EventCard
                  event={event}
                  onClick={() => navigate(`/events/${event.id}`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
