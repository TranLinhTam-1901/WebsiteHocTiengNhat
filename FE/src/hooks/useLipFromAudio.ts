import { useEffect, useRef, useState } from 'react';

/**
 * Maps playing audio amplitude to a 0–1 value for simple lip-sync / mouth openness.
 */
export function useLipFromAudio(audio: HTMLAudioElement | null, enabled: boolean): number {
  const [lip, setLip] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audio || !enabled) {
      setLip(0);
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    ctxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.65;
    analyserRef.current = analyser;

    let source = sourceRef.current;
    try {
      source = ctx.createMediaElementSource(audio);
      sourceRef.current = source;
      source.connect(analyser);
      analyser.connect(ctx.destination);
    } catch {
      // Already connected for this element in strict mode navigations — fall back to no analyser
      analyserRef.current = null;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      const a = analyserRef.current;
      if (a) {
        a.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length / 255;
        setLip(Math.min(1, Math.max(0, avg * 2.2)));
      } else {
        setLip(0);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const resume = () => {
      if (ctx.state === 'suspended') void ctx.resume();
    };
    audio.addEventListener('play', resume);

    return () => {
      audio.removeEventListener('play', resume);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        sourceRef.current?.disconnect();
      } catch {
        /* ignore */
      }
      try {
        analyser.disconnect();
      } catch {
        /* ignore */
      }
      void ctx.close().catch(() => undefined);
      ctxRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
      setLip(0);
    };
  }, [audio, enabled]);

  return lip;
}
