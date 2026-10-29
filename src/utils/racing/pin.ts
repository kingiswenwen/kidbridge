/** Cross-platform SHA-256. PIN is an accidental-touch guard, not account authentication. */
export function sha256(input: string): string {
  const bytes = Array.from(unescape(encodeURIComponent(input)), (c) =>
    c.charCodeAt(0),
  );
  const bitLength = bytes.length * 8;
  bytes.push(128);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--)
    bytes.push(i >= 4 ? 0 : (bitLength >>> (i * 8)) & 255);
  const primes: number[] = [];
  const constants: number[] = [];
  const initial: number[] = [];
  for (let n = 2; primes.length < 64; n++)
    if (!primes.some((p) => n % p === 0)) {
      primes.push(n);
      constants.push(((Math.cbrt(n) % 1) * 0x100000000) | 0);
      if (initial.length < 8)
        initial.push(((Math.sqrt(n) % 1) * 0x100000000) | 0);
    }
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  const h = initial;
  for (let offset = 0; offset < bytes.length; offset += 64) {
    const w: number[] = [];
    for (let i = 0; i < 16; i++)
      w[i] =
        (bytes[offset + i * 4] << 24) |
        (bytes[offset + i * 4 + 1] << 16) |
        (bytes[offset + i * 4 + 2] << 8) |
        bytes[offset + i * 4 + 3];
    for (let i = 16; i < 64; i++) {
      const a = w[i - 15],
        b = w[i - 2];
      w[i] =
        (w[i - 16] +
          (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) +
          w[i - 7] +
          (rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10))) |
        0;
    }
    let [a, b, c, d, e, f, g, k] = h;
    for (let i = 0; i < 64; i++) {
      const t1 =
        (k +
          (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) +
          ((e & f) ^ (~e & g)) +
          constants[i] +
          w[i]) |
        0;
      const t2 =
        ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) +
          ((a & b) ^ (a & c) ^ (b & c))) |
        0;
      k = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    [a, b, c, d, e, f, g, k].forEach((v, i) => (h[i] = (h[i] + v) | 0));
  }
  return h.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
}
export function newId(): string {
  // #ifdef H5
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  // #endif
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
