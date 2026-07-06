'use client';

import React, { useEffect, useState, useRef } from 'react';

interface StatsCounterProps {
  end: number;
  suffix?: string;
  duration?: number; // In milliseconds
}

export const StatsCounter: React.FC<StatsCounterProps> = ({ end, suffix = '', duration = 1500 }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTime: number | null = null;
          
          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const progressPercentage = Math.min(progress / duration, 1);
            
            // Easing function - easeOutQuad
            const easedProgress = progressPercentage * (2 - progressPercentage);
            const currentValue = Math.floor(easedProgress * end);
            
            setCount(currentValue);
            
            if (progress < duration) {
              requestAnimationFrame(animate);
            } else {
              setCount(end);
            }
          };
          
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [end, duration]);

  return (
    <span ref={elementRef} className="font-extrabold tabular-nums">
      {count}
      {suffix}
    </span>
  );
};

export default StatsCounter;
