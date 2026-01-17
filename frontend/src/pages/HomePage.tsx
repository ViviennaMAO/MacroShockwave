import { useEffect, useState } from 'react';
import { eventsApi } from '../lib/api';
import { Event, ApiResponse, GameMode as GameModeType } from '../lib/types';
import { LoadingPage } from '../components/ui/Loading';
import { Empty } from '../components/ui/Empty';
import { motion } from 'framer-motion';
import { Badge } from '../components/ui/Badge';
import { Countdown } from '../components/ui/Countdown';
import { BetModal } from '../components/BetModal';
import { formatAmount, getGameModeName } from '../lib/utils';
import { cn } from '../lib/utils';
import { Pool, Option } from '../lib/types';

export function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ event: Event, pool: Pool, option: Option } | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = (await eventsApi.getEvents()) as unknown as ApiResponse<Event[]>;
      setEvents(response.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBetModal = (event: Event, pool: Pool, option: Option) => {
    setModalData({ event, pool, option });
    setIsModalOpen(true);
  };

  const handleConfirmBet = async (amount: number) => {
    console.log('Placing bet:', amount, modalData);
    // TODO: Implement actual betting logic with useLuffa
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert(`下注成功: ${amount} USD on ${modalData?.option.name}`);
  };

  if (loading) return <LoadingPage />;

  // Find the primary event to showcase (Live or most recent Betting)
  const liveEvent = events.find(e => e.status === 'BETTING') || events[0];

  if (!liveEvent) {
    return <Empty title="暂无活动" description="当前没有正在进行的预测事件。" />;
  }

  return (
    <div className="space-y-6 pb-20">
      {modalData && (
        <BetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={modalData.event}
          pool={modalData.pool}
          option={modalData.option}
          onConfirm={handleConfirmBet}
        />
      )}
      {/* Mobile-First Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-3 rounded-full bg-success animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-xs font-black text-success tracking-widest uppercase">● LIVE</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase leading-none">
            {liveEvent.name}
          </h1>
        </div>

        {/* Digital Clock Styled Countdown */}
        <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-2 flex items-center gap-4 self-start md:self-auto shadow-lg shadow-danger/5">
          <span className="text-danger text-xl">⏰</span>
          <div className="font-mono text-2xl md:text-3xl font-black text-danger tracking-tighter drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
            <Countdown
              targetDate={new Date(new Date(liveEvent.releaseTime).getTime() - 5 * 60 * 1000)}
              variant="digital"
            />
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-3 gap-0 border border-white/10 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-md">
        <div className="p-3 border-r border-white/10 text-center">
          <div className="text-[9px] uppercase tracking-tight text-gray-500 font-bold mb-1">EXPECTED</div>
          <div className="text-sm md:text-xl font-black text-white">{liveEvent.consensusValue}%</div>
        </div>
        <div className="p-3 border-r border-white/10 text-center">
          <div className="text-[9px] uppercase tracking-tight text-gray-500 font-bold mb-1">BASE BTC</div>
          <div className="text-sm md:text-xl font-black text-white">${liveEvent.basePrice?.toLocaleString()}</div>
        </div>
        <div className="p-3 text-center flex flex-col items-center justify-center">
          <div className="text-[9px] uppercase tracking-tight text-gray-500 font-bold mb-1">STATUS</div>
          <Badge variant="success" className="font-bold py-0.5 px-2 text-[10px]">LIVE</Badge>
        </div>
      </div>

      {/* Play Styles Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {liveEvent.pools.map((pool) => (
          <PlayStyleCard
            key={pool.id}
            pool={pool}
            onSelectOption={(option) => handleOpenBetModal(liveEvent, pool, option)}
          />
        ))}
      </div>

      {/* Secondary Stats (Horizontal Grid) */}
      <div className="grid grid-cols-3 gap-3 pt-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
          <div className="text-[10px] text-gray-500 mb-1 font-bold">进行中</div>
          <div className="text-xl font-black text-white">1</div>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
          <div className="text-[10px] text-gray-500 mb-1 font-bold">总奖金</div>
          <div className="text-xl font-black text-white leading-tight">$12.5k</div>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
          <div className="text-[10px] text-gray-500 mb-1 font-bold">待发布</div>
          <div className="text-xl font-black text-white">1</div>
        </div>
      </div>
    </div>
  );
}

function PlayStyleCard({ pool, onSelectOption }: { pool: any, onSelectOption: (option: any) => void }) {
  const isDataSniper = pool.gameMode === GameModeType.DATA_SNIPER;
  const isVolatility = pool.gameMode === GameModeType.VOLATILITY_HUNTER;
  const isJackpot = pool.gameMode === GameModeType.JACKPOT;

  const getStyle = () => {
    if (isDataSniper) return "border-danger/30 shadow-danger/5";
    if (isVolatility) return "border-success/30 shadow-success/5";
    return "border-secondary/30 shadow-secondary/5";
  };

  const getIcon = () => {
    if (isDataSniper) return "🎯";
    if (isVolatility) return "⚡";
    return "🏆";
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={cn(
        "card-premium p-6 group flex flex-col h-full",
        getStyle()
      )}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getIcon()}</span>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">
            {getGameModeName(pool.gameMode)}
          </h3>
        </div>
        {isDataSniper && <Badge variant="default" className="bg-white/5 text-[10px] tracking-widest font-bold">PARI-MUTUEL</Badge>}
        {isJackpot && <Badge variant="warning" className="bg-orange-500/20 text-orange-400 border-none text-[10px] tracking-widest font-black">100X POTENTIAL</Badge>}
      </div>

      <div className="space-y-3 flex-1">
        {pool.options.map((opt: any) => (
          <motion.div
            key={opt.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectOption(opt)}
            className={cn(
              "p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/[0.08] cursor-pointer transition-all flex items-center justify-between",
              isVolatility && "flex-col text-center justify-center py-6"
            )}
          >
            <div className="flex flex-col">
              <span className="text-sm font-black text-white uppercase tracking-wider">{opt.name}</span>
              {isVolatility ? (
                <span className="text-[10px] text-gray-500 font-bold mt-1">
                  {opt.name === 'CALM' ? '< $200 Calm' : '> $1000 Move'}
                </span>
              ) : (
                <span className="text-[10px] text-gray-500 font-bold">Pool Share: ---</span>
              )}
            </div>
            {isJackpot && (
              <span className="text-blue-400 font-black">
                {opt.name.includes('> $98') ? '50x' :
                  opt.name.includes('97k') ? '20x' :
                    opt.name.includes('96k') ? '10x' : '5x'}
              </span>
            )}
            {!isJackpot && !isVolatility && (
              <span className="text-gray-600 transition-transform group-hover:translate-x-1">→</span>
            )}
          </motion.div>
        ))}
      </div>

      {!isJackpot && (
        <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Total Pooled</span>
          <span className="text-sm font-bold text-white">{formatAmount(pool.totalAmount)}</span>
        </div>
      )}
    </motion.div>
  );
}
