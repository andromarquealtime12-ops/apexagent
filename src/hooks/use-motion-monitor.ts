import { useCallback, useEffect, useRef, useState } from "react";

export type MonitorState = "idle" | "requesting" | "active" | "denied" | "error";

/** Pure frame-diff: returns fraction (0-1) of pixels that changed beyond a threshold. */
export function frameDiff(a: Uint8ClampedArray, b: Uint8ClampedArray, pixelThreshold = 30): number {
  let changed = 0;
  const n = a.length / 4;
  for (let i = 0; i < a.length; i += 4) {
    const d = Math.abs(a[i]! - b[i]!) + Math.abs(a[i + 1]! - b[i + 1]!) + Math.abs(a[i + 2]! - b[i + 2]!);
    if (d / 3 > pixelThreshold) changed++;
  }
  return changed / n;
}

interface Opts {
  sensitivity: number; // 1-100
  cooldownMs: number;
  onStart: () => void;
  onStop: () => void;
  onMotion: (confidence: number, snapshot?: () => string | undefined) => void;
}

/**
 * Camera is started ONLY by calling start() from a user click.
 * Video never leaves the device; detection runs on a 64x48 canvas.
 */
export function useMotionMonitor(opts: Opts) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevRef = useRef<Uint8ClampedArray | null>(null);
  const lastEventRef = useRef(0);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const [state, setState] = useState<MonitorState>("idle");
  const [level, setLevel] = useState(0);

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      optsRef.current.onStop();
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    prevRef.current = null;
    setLevel(0);
    setState((st) => (st === "active" || st === "requesting" ? "idle" : st));
  }, []);

  const loop = useCallback(() => {
    const v = videoRef.current;
    if (!v || !streamRef.current) return;
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 48;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    let last = 0;
    const step = (t: number) => {
      rafRef.current = requestAnimationFrame(step);
      if (t - last < 200 || !ctx || v.readyState < 2) return;
      last = t;
      ctx.drawImage(v, 0, 0, 64, 48);
      const data = ctx.getImageData(0, 0, 64, 48).data;
      if (prevRef.current) {
        const diff = frameDiff(prevRef.current, data);
        setLevel(diff);
        const threshold = 0.25 - (optsRef.current.sensitivity / 100) * 0.23; // 2%..25%
        const nowMs = Date.now();
        if (diff > threshold && nowMs - lastEventRef.current > optsRef.current.cooldownMs) {
          lastEventRef.current = nowMs;
          const confidence = Math.min(1, diff / (threshold * 3));
          optsRef.current.onMotion(confidence, () => {
            const big = document.createElement("canvas");
            big.width = 320;
            big.height = Math.round((320 * v.videoHeight) / (v.videoWidth || 1)) || 240;
            big.getContext("2d")?.drawImage(v, 0, 0, big.width, big.height);
            return big.toDataURL("image/jpeg", 0.6);
          });
        }
      }
      prevRef.current = data;
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("error");
      return;
    }
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setState("active");
      optsRef.current.onStart();
      loop();
    } catch (e) {
      setState(e instanceof DOMException && e.name === "NotAllowedError" ? "denied" : "error");
    }
  }, [loop]);

  useEffect(() => {
    const onHide = () => document.hidden && stop();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", stop);
      stop();
    };
  }, [stop]);

  return { videoRef, state, level, start, stop };
}
