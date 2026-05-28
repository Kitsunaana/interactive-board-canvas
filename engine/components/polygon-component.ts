import { Polygon, Rectangle, type PointData, type ShapePrimitive } from "../maths";
import { BaseShapeComponent } from "./base-shape-component";

export class PolygonComponent extends BaseShapeComponent {
  public tension: number = 0.1

  protected _geometry: Polygon;

  public constructor(private readonly _points: Array<PointData>) {
    super()

    this._geometry = new Polygon(_points)
  }

  public getBounds(): Rectangle {
    const verticesCopy = this._points.map((point) => ({ ...point }))
    const splineExtrema = this._geometry.computeTensionedCurveExtrema(this.tension)
    const compositePoints = verticesCopy.concat(splineExtrema)

    const rawBounds = Polygon.prototype.getBounds.call({ points: compositePoints })

    const strokePadding = this.lineWidth / 2

    rawBounds.x -= strokePadding
    rawBounds.y -= strokePadding
    rawBounds.width += this.lineWidth
    rawBounds.height += this.lineWidth

    return rawBounds
  }

  public render(context: CanvasRenderingContext2D): void {
    const bounds = this.getBounds()

    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

    this._tracePath(context)
    this.applyMainStyles(context)
  }

  public renderHit(context: CanvasRenderingContext2D): void {

  }

  public update(time: number): void {

  }

  private _tracePath(context: CanvasRenderingContext2D): void {
    context.beginPath()
    if (this._shouldRenderStraightEdges()) this._traceLinearPath(context)
    else this._traceSplinePath(context)
    context.closePath()
  }

  private _shouldRenderStraightEdges(): boolean {
    return this._points.length < 3 || this.tension === 0
  }

  private _traceLinearPath(context: CanvasRenderingContext2D): void {
    context.moveTo(this._points[0].x, this._points[0].y)
    this._points.forEach(point => context.lineTo(point.x, point.y))
  }

  private _traceSplinePath(context: CanvasRenderingContext2D): void {
    const length = this._points.length

    context.moveTo(this._points[0].x, this._points[0].y)

    for (let i = 0; i < length; i++) {
      const p0 = this._points[(i - 1 + length) % length]
      const p1 = this._points[i]
      const p2 = this._points[(i + 1) % length]
      const p3 = this._points[(i + 2) % length]

      const cp1x = p1.x + (p2.x - p0.x) * this.tension
      const cp1y = p1.y + (p2.y - p0.y) * this.tension
      const cp2x = p2.x - (p3.x - p1.x) * this.tension
      const cp2y = p2.y - (p3.y - p1.y) * this.tension

      context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
    }
  }
}
