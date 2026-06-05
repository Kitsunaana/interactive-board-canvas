import { Bounds, Matrix3x3, Point, type PointData, Rectangle } from "../maths";
import { type GetBoundsParams } from "../world/sim-object";
import { Shape } from "./Shape";

export class Ellipse extends Shape {
  public initialPoints: Array<PointData>
  public pointsToTrace: Array<PointData>

  public constructor(private x: number, private y: number, private rx: number, private ry: number) {
    super()

    this.isShowOrigins = true

    this.initialPoints = this._getEllipsePath()
    this.pointsToTrace = this._getEllipsePath()
  }

  private _getEllipsePath() {
    const cx = this.x
    const cy = this.y
    const rx = this.rx
    const ry = this.ry

    const K = 4 * (Math.sqrt(2) - 1) / 3

    const transform = (x: number, y: number) => new Point(cx + x, cy + y)

    return [
      transform(rx, 0),
      transform(rx, K * ry),
      transform(K * rx, ry),
      transform(0, ry),
      transform(-K * rx, ry),
      transform(-rx, K * ry),
      transform(-rx, 0),
      transform(-rx, -K * ry),
      transform(-K * rx, -ry),
      transform(0, -ry),
      transform(K * rx, -ry),
      transform(rx, -K * ry),
    ]
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