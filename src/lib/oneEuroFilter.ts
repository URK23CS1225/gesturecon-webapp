/**
 * One Euro Filter — per-axis low-pass filter that adapts its cutoff
 * frequency to the speed of the signal. Fast movements pass through
 * with low lag; slow movements are heavily smoothed.
 *
 * Reference: Géry Casiez, Nicolas Roussel, Daniel Vogel (2012).
 * "1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input in
 * Interactive Systems." CHI 2012.
 */

function lowPassFilter(x: number, xPrev: number, alpha: number): number {
  return alpha * x + (1 - alpha) * xPrev;
}

function alpha(cutoff: number, dt: number): number {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;

  private xPrev: number | null = null;
  private dxPrev = 0;
  private tPrev: number | null = null;

  constructor(minCutoff: number, beta: number, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  filter(x: number, timestamp: number): number {
    if (this.tPrev === null || this.xPrev === null) {
      this.tPrev = timestamp;
      this.xPrev = x;
      return x;
    }

    const dt = Math.max((timestamp - this.tPrev) / 1000, 1e-6); // seconds
    this.tPrev = timestamp;

    // Derivative — smoothed with dCutoff
    const dx = (x - this.xPrev) / dt;
    const dxFiltered = lowPassFilter(dx, this.dxPrev, alpha(this.dCutoff, dt));
    this.dxPrev = dxFiltered;

    // Adaptive cutoff: fast movement → higher cutoff → less lag
    const cutoff = this.minCutoff + this.beta * Math.abs(dxFiltered);

    // Position filter
    const filtered = lowPassFilter(x, this.xPrev, alpha(cutoff, dt));
    this.xPrev = filtered;
    return filtered;
  }

  reset(): void {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }

  setParams(minCutoff: number, beta: number, dCutoff = 1.0): void {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }
}
