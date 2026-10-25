/**
 * Dense Gaussian elimination with partial pivoting.
 * Circuits built in the lab have at most a few dozen unknowns, so a dense
 * solver is simple, exact enough (double precision) and fast.
 *
 * Returns null when the matrix is singular (no unique solution).
 */
export function solveLinear(matrix: number[][], rhs: number[]): number[] | null {
  const n = rhs.length;
  if (n === 0) return [];
  const a = matrix.map((row, i) => [...row, rhs[i]]);
  let scale = 0;
  for (const row of matrix) for (const v of row) scale = Math.max(scale, Math.abs(v));
  const tol = Math.max(scale, 1) * 1e-12;

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    }
    if (Math.abs(a[pivot][col]) < tol) return null;
    if (pivot !== col) [a[pivot], a[col]] = [a[col], a[pivot]];
    for (let r = col + 1; r < n; r++) {
      const f = a[r][col] / a[col][col];
      if (f === 0) continue;
      for (let c = col; c <= n; c++) a[r][c] -= f * a[col][c];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = a[r][n];
    for (let c = r + 1; c < n; c++) s -= a[r][c] * x[c];
    x[r] = s / a[r][r];
  }
  return x;
}

/** Union–find over string keys. */
export class DisjointSet {
  private parent = new Map<string, string>();

  add(k: string): void {
    if (!this.parent.has(k)) this.parent.set(k, k);
  }

  find(k: string): string {
    this.add(k);
    let root = k;
    while (this.parent.get(root) !== root) root = this.parent.get(root)!;
    let cur = k;
    while (this.parent.get(cur) !== root) {
      const next = this.parent.get(cur)!;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }

  same(a: string, b: string): boolean {
    return this.find(a) === this.find(b);
  }
}
