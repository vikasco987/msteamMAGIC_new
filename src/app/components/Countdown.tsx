'use client';

import { useEffect, useState } from 'react';

export default function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const difference = +new Date(targetDate) - +new Date();
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
    };
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
      };
    };

    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // update every minute

    return () => clearTimeout(timer);
  }, [targetDate]);

  return (
    <div className="text-xs text-gray-500">
      {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m left
    </div>
  );
}
