import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Event, Pool, Option, GameMode } from '../lib/types';
import { getGameModeName, formatAmount } from '../lib/utils';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface BetModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event;
    pool: Pool;
    option: Option;
    onConfirm: (amount: number) => Promise<void>;
}

export function BetModal({ isOpen, onClose, event, pool, option, onConfirm }: BetModalProps) {
    const [amount, setAmount] = useState<string>('10');
    const [loading, setLoading] = useState(false);

    const numAmount = parseFloat(amount) || 0;

    // Calculate potential win
    // For Jackpot, we use fixed multipliers shown in screenshots (50x, 20x, etc)
    const getJackpotMultiplier = () => {
        if (option.name.includes('> $98')) return 50;
        if (option.name.includes('97k')) return 20;
        if (option.name.includes('96k')) return 10;
        if (option.name.includes('95k')) return 5;
        return 2;
    };

    const multiplier = pool.gameMode === GameMode.JACKPOT ? getJackpotMultiplier() : 1.95; // 1.95 for simplicity
    const potentialWin = numAmount * multiplier;

    const handlePlaceBet = async () => {
        setLoading(true);
        try {
            await onConfirm(numAmount);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const quickAmounts = [10, 50, 100, 500];

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                            />
                        </Dialog.Overlay>
                        <Dialog.Content asChild>
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="w-full max-w-[440px] pointer-events-auto focus:outline-none overflow-y-auto max-h-[90vh]"
                                >
                                    <div className="card-premium p-0 border-white/10 shadow-2xl">
                                        {/* Header */}
                                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">🎯</span>
                                                <Dialog.Title className="text-xl font-black text-white tracking-tight">
                                                    Confirm Your Bet
                                                </Dialog.Title>
                                            </div>
                                            <Dialog.Close className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 text-gray-400 transition-colors">
                                                <span className="text-xl">✕</span>
                                            </Dialog.Close>
                                        </div>

                                        {/* Summary Box */}
                                        <div className="p-6 space-y-6">
                                            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Event:</span>
                                                    <span className="text-sm font-black text-white">{event.name}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mode:</span>
                                                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
                                                        <span className="text-xs">
                                                            {pool.gameMode === GameMode.DATA_SNIPER ? '🎯' :
                                                                pool.gameMode === GameMode.VOLATILITY_HUNTER ? '🌊' : '🎰'}
                                                        </span>
                                                        <span className="text-xs font-black text-primary-light text-primary uppercase tracking-tighter">
                                                            {getGameModeName(pool.gameMode)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Selection:</span>
                                                    <span className="px-3 py-1 rounded-lg bg-success/10 border border-success/20 text-xs font-black text-success uppercase tracking-widest">
                                                        {option.name}
                                                    </span>
                                                </div>
                                                {pool.gameMode === GameMode.JACKPOT && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Odds:</span>
                                                        <span className="text-sm font-black text-yellow-500">{multiplier}x</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Amount Input */}
                                            <div className="space-y-4">
                                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                                    Bet Amount (USD)
                                                </label>
                                                <div className="relative group">
                                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-gray-600 group-focus-within:text-white transition-colors">
                                                        $
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                        className="w-full bg-white/[0.03] border border-white/5 focus:border-primary/50 focus:bg-white/[0.05] rounded-2xl py-5 pl-12 pr-6 text-3xl font-black text-white outline-none transition-all"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-4 gap-2">
                                                    {quickAmounts.map((val) => (
                                                        <button
                                                            key={val}
                                                            onClick={() => setAmount(val.toString())}
                                                            className={cn(
                                                                "py-3 rounded-xl text-sm font-black transition-all border",
                                                                numAmount === val
                                                                    ? "bg-primary/20 border-primary/50 text-white shadow-lg shadow-primary/10"
                                                                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/[0.08]"
                                                            )}
                                                        >
                                                            ${val}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Potential Win - High Impact Display */}
                                            {(multiplier > 1) && (
                                                <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 flex items-center justify-between shadow-inner">
                                                    <span className="text-sm font-black text-gray-500 uppercase tracking-tight">Potential Win:</span>
                                                    <span className="text-2xl font-black text-orange-500 text-glow-orange">
                                                        {formatAmount(potentialWin)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="p-6 border-t border-white/5 grid grid-cols-2 gap-4">
                                            <Button variant="secondary" onClick={onClose} disabled={loading} className="py-4">
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="primary"
                                                onClick={handlePlaceBet}
                                                disabled={loading || numAmount <= 0}
                                                className="py-4 shadow-xl shadow-primary/20"
                                            >
                                                {loading ? 'Confirming...' : 'Place Bet'}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}
