import { useEffect, useState } from 'react';
import { getCountdown } from '../../lib/utils';

interface CountdownProps {
  targetDate: Date | string;
  onExpire?: () => void;
}

export function Countdown({ targetDate, onExpire }: CountdownProps) {
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
    return <span className="text-gray-400">已结束</span>;
  }

  return (
    <div className="flex items-center space-x-2">
      {countdown.days > 0 && (
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-white">{countdown.days}</span>
          <span className="text-xs text-gray-400">天</span>
        </div>
      )}
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{countdown.hours.toString().padStart(2, '0')}</span>
        <span className="text-xs text-gray-400">时</span>
      </div>
      <span className="text-2xl font-bold text-white">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{countdown.minutes.toString().padStart(2, '0')}</span>
        <span className="text-xs text-gray-400">分</span>
      </div>
      <span className="text-2xl font-bold text-white">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{countdown.seconds.toString().padStart(2, '0')}</span>
        <span className="text-xs text-gray-400">秒</span>
      </div>
    </div>
  );
}
