import { useState } from 'react';
import { Event, Pool, Option } from '../lib/types';
import { betsApi } from '../lib/api';
import { useLuffa } from '../hooks/useLuffa';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { formatAmount, formatOdds } from '../lib/utils';
import { motion } from 'framer-motion';

interface BettingPanelProps {
  event: Event;
  pool: Pool;
  onBetPlaced?: () => void;
}

export function BettingPanel({ event, pool, onBetPlaced }: BettingPanelProps) {
  const { account, isConnected, sendTransaction } = useLuffa();
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [amount, setAmount] = useState<string>('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canBet = event.status === 'BETTING' && event.canBet;
  const numAmount = parseFloat(amount) || 0;

  // 计算当前赔率
  const calculateOdds = (option: Option): number => {
    const totalPool = pool.totalAmount * 0.97;
    const optionTotal = option.totalAmount;
    if (optionTotal === 0) return 0;
    return totalPool / optionTotal;
  };

  // 计算预估收益
  const estimatedWinnings = selectedOption
    ? numAmount * calculateOdds(selectedOption)
    : 0;

  const handlePlaceBet = async () => {
    if (!isConnected || !account) {
      alert('请先连接钱包');
      return;
    }

    if (!selectedOption) {
      setError('请选择一个选项');
      return;
    }

    if (numAmount < 10) {
      setError('最小下注金额为 10 USDT');
      return;
    }

    if (numAmount > 10000) {
      setError('最大下注金额为 10,000 USDT');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. 创建订单
      const orderResponse = await betsApi.placeBet({
        eventId: event.id,
        optionId: selectedOption.id,
        amount: numAmount,
      });

      const orderId = (orderResponse as any).data.orderId;

      // 2. 发起链上交易
      // TODO: 替换为实际的合约地址和方法
      const txResult = await sendTransaction({
        to: '0x...', // 合约地址
        value: numAmount.toString(),
        data: '0x', // 合约调用数据
      });

      if (!txResult.success) {
        throw new Error('交易失败');
      }

      // 3. 确认订单
      await betsApi.confirmBet(orderId, txResult.txHash);

      // 4. 刷新页面
      if (onBetPlaced) {
        onBetPlaced();
      }

      // 5. 重置表单
      setSelectedOption(null);
      setAmount('100');

      alert('下注成功！');
    } catch (err: any) {
      setError(err.message || '下注失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="font-bold text-white">选择预测</h3>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {pool.options.map((option) => {
            const odds = calculateOdds(option);
            const isSelected = selectedOption?.id === option.id;

            return (
              <motion.button
                key={option.id}
                whileHover={{ scale: canBet ? 1.02 : 1 }}
                whileTap={{ scale: canBet ? 0.98 : 1 }}
                onClick={() => canBet && setSelectedOption(option)}
                disabled={!canBet}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                  }
                  ${!canBet && 'opacity-50 cursor-not-allowed'}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-white">{option.name}</span>
                  <span className="text-xl font-bold text-primary">
                    {odds > 0 ? formatOdds(odds) : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">下注金额</span>
                  <span className="text-white">{formatAmount(option.totalAmount)}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Amount Input */}
        {canBet && (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                下注金额（USDT）
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="10"
                  max="10000"
                  step="10"
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary focus:outline-none"
                  placeholder="输入金额"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span>最小: 10 USDT</span>
                <span>最大: 10,000 USDT</span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[100, 500, 1000, 5000].map((value) => (
                <button
                  key={value}
                  onClick={() => setAmount(value.toString())}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white transition-colors"
                >
                  {value}
                </button>
              ))}
            </div>

            {/* Estimated Winnings */}
            {selectedOption && numAmount >= 10 && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">预估收益</span>
                  <span className="text-2xl font-bold text-success">
                    {formatAmount(estimatedWinnings)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>当前赔率</span>
                  <span>{formatOdds(calculateOdds(selectedOption))}</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handlePlaceBet}
              disabled={!selectedOption || numAmount < 10 || loading || !isConnected}
            >
              {!isConnected
                ? '请先连接钱包'
                : loading
                ? '下注中...'
                : '确认下注'}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              下注后将扣除 3% 平台手续费
            </div>
          </>
        )}

        {/* Not Betting */}
        {!canBet && (
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
            <p className="text-gray-400">
              {event.status === 'OPEN' && '下注尚未开放'}
              {event.status === 'LOCKED' && '下注已截止'}
              {event.status === 'SETTLING' && '正在结算中'}
              {event.status === 'SETTLED' && '事件已结算'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
