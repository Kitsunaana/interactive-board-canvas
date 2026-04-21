
export function createRotatedEllipsePathV2(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, angle: number) {
  const K = 4 * (Math.sqrt(2) - 1) / 3
  const transform = (x: number, y: number) => [cx + x, cy + y]

  ctx.beginPath();

  const [x0, y0] = transform(rx, 0);
  ctx.moveTo(x0, y0);

  const [x1, y1] = transform(rx, K * ry);
  const [x2, y2] = transform(K * rx, ry);
  const [x3, y3] = transform(0, ry);
  ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);

  const [x4, y4] = transform(-K * rx, ry);
  const [x5, y5] = transform(-rx, K * ry);
  const [x6, y6] = transform(-rx, 0);
  ctx.bezierCurveTo(x4, y4, x5, y5, x6, y6);

  const [x7, y7] = transform(-rx, -K * ry);
  const [x8, y8] = transform(-K * rx, -ry);
  const [x9, y9] = transform(0, -ry);
  ctx.bezierCurveTo(x7, y7, x8, y8, x9, y9);

  const [x10, y10] = transform(K * rx, -ry);
  const [x11, y11] = transform(rx, -K * ry);
  ctx.bezierCurveTo(x10, y10, x11, y11, x0, y0);

  ctx.closePath()
}
