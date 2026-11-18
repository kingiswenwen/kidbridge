// Shared by the SVG generator and the moving car; one coordinate system.
export const TRACK = { width: 640, height: 280, start: 70, span: 500, baseline: 182, bend: 52 };
export function trackPoint(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return { x: TRACK.start + TRACK.span * p, y: TRACK.baseline + TRACK.bend * Math.sin(p * Math.PI * 2) };
}
export function trackPath() {
  return Array.from({ length: 101 }, (_, n) => {
    const p = trackPoint(n / 100);
    return `${n ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }).join(' ');
}
