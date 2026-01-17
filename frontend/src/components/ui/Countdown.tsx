import { useEffect, useState } from 'react';
import { getCountdown } from '../../lib/utils';

interface CountdownProps {
  targetDate: Date | string;
  onExpire?: () => void;
  variant?: 'default' | 'digital';
}

export function Countdown({ targetDate, onExpire, variant = 'default' }: CountdownProps) {
  const [countdown, setCountdown] = useState(() => getCountdown(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const newCountdown = getCountdown(targetDate);
      setCountdown(newCountdown);

      if (newCountdown.isExpired && onExpire) {
        onExpire();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (countdown.isExpired) {
    return <span className="opacity-50">CLOSED</span>;
  }

  if (variant === 'digital') {
    return (
      <span className="font-mono">
        {countdown.days.toString().padStart(2, '0')}:
        {countdown.hours.toString().padStart(2, '0')}:
        {countdown.minutes.toString().padStart(2, '0')}:
        {countdown.seconds.toString().padStart(2, '0')}
      </span>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {countdown.days > 0 && (
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-white">{countdown.days}</span>
          <span className="text-xs text-gray-500">D</span>
        </div>
      )}
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{countdown.hours.toString().padStart(2, '0')}</span>
        <span className="text-xs text-gray-500">H</span>
      </div>
      <span className="text-2xl font-bold text-white opacity-30">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{countdown.minutes.toString().padStart(2, '0')}</span>
        <span className="text-xs text-gray-500">M</span>
      </div>
      <span className="text-2xl font-bold text-white opacity-30">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{countdown.seconds.toString().padStart(2, '0')}</span>
        <span className="text-xs text-gray-500">S</span>
      </div>
    </div>
  );
}
