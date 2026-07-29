import { useEffect, useRef } from "react";
import { audioEngine } from "../lib/audioEngine";

const BARS = 48;
// acid (200,255,0) → magenta (255,62,165)
const mix = (t: number, a: number, b: number) => Math.round(a + (b - a) * t);

/**
 * Subtle spectrum behind the editor: bars rise from the bottom edge,
 * fading cyan → fuchsia. Pure decoration — pointer events pass through.
 */
export default function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    const data = new Uint8Array(128);
    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx2d.clearRect(0, 0, w, h);
      if (!audioEngine.getFrequencyData(data)) return;

      const barWidth = w / BARS;
      for (let i = 0; i < BARS; i++) {
        // skip the last bins — mostly empty air
        const v = data[Math.floor((i * data.length * 0.75) / BARS)] / 255;
        const barHeight = v * v * h * 0.6;
        if (barHeight < 1) continue;
        const t = i / BARS;
        ctx2d.fillStyle = `rgba(${mix(t, 200, 255)},${mix(t, 255, 62)},${mix(t, 0, 165)},${0.25 + v * 0.3})`;
        ctx2d.fillRect(i * barWidth + 1, h - barHeight, barWidth - 2, barHeight);
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-35"
    />
  );
}
