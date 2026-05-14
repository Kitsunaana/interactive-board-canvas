import { Mixin } from "ts-mixer";
import { type PointData, Rectangle, Circle as MathCircle, Polygon } from "../maths";
import { Shape, type ShapeConfig } from "./Shape"

export function createRotatedEllipsePath(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, angle: number) {
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

export interface EllipseConfig extends ShapeConfig {
  radius: number
  x: number
  y: number
}

export class Circle extends Mixin(Shape, MathCircle) {
  public constructor(config: EllipseConfig) {
    super(config)

    this.radius = config.radius
    this.x = config.x
    this.y = config.y
  }

  public getClientRect(): Rectangle {
    const matrix = this.computeMatrix()
    const points = this.getPoints().map((point) => matrix.applyToPoint(point))
    const bounds = Polygon.prototype.getBounds.call({ points })

    return bounds
  }

  public getPoints(): Array<PointData> {
    const points = this.getBounds().getCorner()

    return points
  }

  public buildPath(context: CanvasRenderingContext2D): void {
    context.beginPath()
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    context.stroke()
    context.fill()
    context.closePath()
  }
}