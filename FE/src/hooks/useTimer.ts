import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook để quản lý thời gian suy nghĩ cho từng câu hỏi.
 */
export const useTimer = () => {
  const [time, setTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTime(0);
    timerRef.current = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
  }, [stopTimer]);

  const resetTimer = useCallback(() => {
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  return { time, startTimer, stopTimer, resetTimer };
};
