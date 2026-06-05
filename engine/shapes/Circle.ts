import { Bounds, Matrix3x3, Point, type PointData, Polygon, Rectangle } from "../maths";
import { type GetBoundsParams, SimObject } from "../world/sim-object";
import { Shape } from "./Shape";

export function getEllipsePath(cx: number, cy: number, rx: number, ry: number, matrix: Matrix3x3) {
  const K = 4 * (Math.sqrt(2) - 1) / 3

  const transform = (x: number, y: number) => {
    return matrix.applyToPoint(new Point(cx + x, cy + y)).array()
  }

  const [x0, y0] = transform(rx, 0);
  const [x1, y1] = transform(rx, K * ry);
  const [x2, y2] = transform(K * rx, ry);
  const [x3, y3] = transform(0, ry);
  const [x4, y4] = transform(-K * rx, ry);
  const [x5, y5] = transform(-rx, K * ry);
  const [x6, y6] = transform(-rx, 0);
  const [x7, y7] = transform(-rx, -K * ry);
  const [x8, y8] = transform(-K * rx, -ry);
  const [x9, y9] = transform(0, -ry);
  const [x10, y10] = transform(K * rx, -ry);
  const [x11, y11] = transform(rx, -K * ry);

  return [
    new Point(x0, y0),
    new Point(x1, y1),
    new Point(x2, y2),
    new Point(x3, y3),
    new Point(x4, y4),
    new Point(x5, y5),
    new Point(x6, y6),
    new Point(x7, y7),
    new Point(x8, y8),
    new Point(x9, y9),
    new Point(x10, y10),
    new Point(x11, y11),
  ]
}

export class Circle extends Shape {
  public initialPoints: Array<PointData>
  public pointsToTrace: Array<PointData>

  public constructor(private x: number, private y: number, private rx: number, private ry: number) {
    super()

    this.isShowOrigins = true

    this.initialPoints = getEllipsePath(x, y, rx, ry, Matrix3x3.identity())
    this.pointsToTrace = getEllipsePath(x, y, rx, ry, Matrix3x3.identity())
  }

  public getBounds(params: GetBoundsParams = {}): Rectangle {
    const matrix = params.skipTransform
      ? Matrix3x3.identity()
      : params.skipWorldTransform
        ? Matrix3x3.compose(this.localMatrix)
        : Matrix3x3.compose(this.worldMatrix, this.localMatrix)

    const center = matrix.applyToPoint(new Point(this.x, this.y))

    const halfSize = new Point(
      Math.sqrt(Math.pow(matrix.a * this.rx, 2) + Math.pow(matrix.c * this.ry, 2)),
      Math.sqrt(Math.pow(matrix.b * this.rx, 2) + Math.pow(matrix.d * this.ry, 2))
    )

    const min = center.sub(halfSize)
    const max = center.add(halfSize)

    const bounds = new Bounds(...min.array(), ...max.array())

    return bounds.rectangle
  }

  public render(context: CanvasRenderingContext2D): void {
    this._traceSplinePath(context)
    context.stroke()

    const bounds = this.getBounds({ skipTransform: true })
    // context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

    const selfRect = this.getBounds({ skipTransform: true })
    // context.strokeRect(selfRect.x, selfRect.y, selfRect.width, selfRect.height)

    this.drawOrigins(context, this._worldMatrix)
  }

  private _traceSplinePath(context: CanvasRenderingContext2D): void {
    const length = this.pointsToTrace.length

    context.moveTo(this.pointsToTrace[0].x, this.pointsToTrace[0].y)

    for (let i = 1; i < length; i += 3) {
      const p1 = this.pointsToTrace[i]
      const p2 = this.pointsToTrace[(i + 1) % length]
      const p3 = this.pointsToTrace[(i + 2) % length]

      context.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)
    }
  }
}