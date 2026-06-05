import { Matrix3x3, Polygon, Rectangle, type PointData } from "../maths"
import { type GetBoundsParams } from "../world/sim-object"
import { Shape } from "./Shape"

export class PolygonShape extends Shape {
  public tension: number = 0.2
  public geometry: Polygon

  public pointsToTrace: Array<PointData> = []

  public constructor(public readonly initialPoints: Array<PointData>) {
    super()

    this.isShowOrigins = true

    this.geometry = new Polygon(initialPoints)
    this.pointsToTrace = initialPoints
  }

  public getBounds(params: GetBoundsParams = {}): Rectangle {
    let points = this.initialPoints

    if (params.skipTransform === false) {
      const computed = params.skipWorldTransform
        ? this.localMatrix
        : Matrix3x3.compose(this.worldMatrix, this.localMatrix)

      points = this.initialPoints.map((point) => computed.applyToPoint(point))
    }

    const curved = Polygon.prototype.computeTensionedCurveExtrema.call({ points }, this.tension)
    const allPoints = points.concat(curved)

    return Polygon.prototype.getBounds.call({ points: allPoints })
  }

  public render(context: CanvasRenderingContext2D): void {
    context.save()
    this.tracePath(context)
    context.stroke()
    context.closePath()

    const bounds = this.getBounds({ skipTransform: false })
    // context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

    const selfRect = this.getBounds()
    // context.strokeRect(selfRect.x, selfRect.y, selfRect.width, selfRect.height)

    this.drawOrigins(context, this._worldMatrix)
  }

  public tracePath(context: CanvasRenderingContext2D): void {
    context.beginPath()
    if (this._shouldRenderStraightEdges()) this._traceLinearPath(context)
    else this._traceSplinePath(context)
    context.closePath()
  }

  private _shouldRenderStraightEdges(): boolean {
    return this.pointsToTrace.length < 3 || this.tension === 0
  }

  private _traceLinearPath(context: CanvasRenderingContext2D): void {
    context.moveTo(this.pointsToTrace[0].x, this.pointsToTrace[0].y)
    this.pointsToTrace.forEach((point) => context.lineTo(point.x, point.y))
  }

  private _traceSplinePath(context: CanvasRenderingContext2D): void {
    const length = this.pointsToTrace.length

    context.moveTo(this.pointsToTrace[0].x, this.pointsToTrace[0].y)

    for (let i = 0; i < length; i++) {
      const p0 = this.pointsToTrace[(i - 1 + length) % length]
      const p1 = this.pointsToTrace[i]
      const p2 = this.pointsToTrace[(i + 1) % length]
      const p3 = this.pointsToTrace[(i + 2) % length]

      const cp1x = p1.x + (p2.x - p0.x) * this.tension
      const cp1y = p1.y + (p2.y - p0.y) * this.tension
      const cp2x = p2.x - (p3.x - p1.x) * this.tension
      const cp2y = p2.y - (p3.y - p1.y) * this.tension

      context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
    }
  }

  public update(time: number): void {

  }
}