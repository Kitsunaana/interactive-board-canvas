import { Node, type NodeConfig } from "../Node"
import * as Primitive from "../maths"

export interface EllipseConfig extends NodeConfig {
  points: Primitive.PointData[],
}

export class Ellipse extends Node {
  private readonly _type = "Shape" as const

  public readonly boundsSkippedRotate: Primitive.Rectangle

  private readonly _math: Primitive.Polygon
  private readonly _matrix: Primitive.Matrix = new Primitive.Matrix()
  private readonly _bounds: Primitive.Rectangle = new Primitive.Rectangle()

  public get absolutePositionCursor() {
    return this.parent()!.absolutePositionCursor
  }

  constructor(config: EllipseConfig) {
    super(config)

    this._math = new Primitive.Polygon(config.points)
    this.boundsSkippedRotate = this._math.getBounds()
  }

  public getType() {
    return this._type
  }

  public rotate(angle: number): void {
    const bounds = this.boundsSkippedRotate

    this._matrix
      .clear()
      .setPivot(bounds.centerX, bounds.centerY)
      .rotate(angle)

    this._math.applyMatrix(this._matrix)
  }

  public contains(point: Primitive.PointData): boolean {
    return this._math.contains(point.x, point.y)
  }

  public getClientRect(): Primitive.Rectangle {
    const scale = this.scale()
    const position = this.position()

    this._math.getBounds(this._bounds)

    this._bounds.x = this._bounds.x * scale.x + position.x
    this._bounds.y = this._bounds.y * scale.y + position.y
    this._bounds.width *= scale.x
    this._bounds.height *= scale.y

    return this._bounds
  }

  public draw(context: CanvasRenderingContext2D): void {
    context.save()
    context.translate(this.position().x, this.position().y)
    context.scale(this.scale().x, this.scale().y)

    context.strokeStyle = "red"
    createRotatedEllipsePathV2(context, 150, 150, 150, 95, 0.0)
    context.stroke()

    context.restore()
  }
}

function createRotatedEllipsePathV2(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, angle: number) {
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
