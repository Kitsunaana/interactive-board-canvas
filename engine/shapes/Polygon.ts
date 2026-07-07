import { Matrix3x3, Point, Polygon, Rectangle, type PointData } from "../maths"
import { BackgroundImage } from "../styles/background-image"
import { type GetBoundsParams } from "../world/sim-object"
import { Shape } from "./Shape"

const source = "https://avatars.mds.yandex.net/i?id=2e34b2a2ac0026106cc76353e2797bf03b9e2551-5249431-images-thumbs&n=13"

export class PolygonShape extends Shape {
  public static isPolygon(candidate: unknown): candidate is PolygonShape {
    return candidate instanceof PolygonShape
  }
  
  public static computePointsToTraceWithTension(points: Array<PointData>, tension: number, closed: boolean) {
    const length = points.length

    return points.reduce((result, _, index, list) => {
      if (!closed && index === list.length - 1) return result

      const p0 = list[(index - 1 + length) % length]
      const p1 = list[index]
      const p2 = list[(index + 1) % length]
      const p3 = list[(index + 2) % length]

      const cp1 = Point
        .fromData(p2)
        .sub(p0)
        .scale(tension)
        .add(p1)

      const cp2 = Point
        .fromData(p2)
        .sub(
          Point
            .fromData(p3)
            .sub(p1)
            .scale(tension)
        )

      return result.concat([cp1, cp2, p2])
    }, [{ ...points[0] }] as Array<PointData>)
  }

  public tension: number = 0.0
  public closed: boolean = true
  public pointsToTrace: Array<PointData> = []

  public constructor(public readonly initialPoints: Array<PointData>) {
    super()

    this.isShowOrigins = true
    this.pointsToTrace = PolygonShape.computePointsToTraceWithTension(initialPoints, this.tension, this.closed)

    this.backgroundImage = new BackgroundImage()
      .setSimObject(this)
      .setContainer(this.getBounds())
      .setBackgroundImage(source)
      .setBackgroundSize("cover")

    this.backgroundImage = null
  }

  public update(time: number): void {

  }

  public updateAfterTransform(): void {
    super.updateAfterTransform()
    
    this.pointsToTrace = PolygonShape.computePointsToTraceWithTension(this.pointsToTrace, this.tension, this.closed)
  }

  public getUnrotateShapeBounds() {
    const unrotate = Matrix3x3.aroundOrigin(this.getOriginPosition("rotate"), () => {
      return Matrix3x3.rotate(-this.getCurrentAngle())
    })

    const matrix = Matrix3x3.compose(unrotate, this.worldMatrix, this.localMatrix)

    const points = this.initialPoints.map(matrix.applyToPoint.bind(matrix)) as Array<PointData>
    const curved = Polygon.computeTensionedCurveExtrema(points, this.tension)
    const bounds = Polygon.getBounds(points.concat(curved))

    return bounds
    return this.applyStylesToBounds(bounds)
  }

  public getBounds(params: GetBoundsParams = {}): Rectangle {
    const points = this._getPointsByComputeBounds(params)
    const curved = Polygon.computeTensionedCurveExtrema(points, this.tension)

    const bounds = Polygon.getBounds(points.concat(curved))

    return bounds

    return this.applyStylesToBounds(bounds)
  }

  public tracePath(context: CanvasRenderingContext2D): void {
    context.beginPath()
    if (this._shouldRenderStraightEdges()) this.traceLinearPath(context)
    else this.traceSplinePath(context)
    if(this.closed) context.closePath()
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    super.renderHit(context)
  }

  public render(context: CanvasRenderingContext2D): void {
    super.render(context)
    
    const rotateOrigin = this.getOriginPosition("rotate")

    context.save()
    context.beginPath()

    Matrix3x3
      .aroundOrigin(rotateOrigin, () => Matrix3x3.rotate(this.getCurrentAngle()))
      .applyToContext(context)

    const rect = this.getUnrotateShapeBounds()
    // context.strokeRect(rect.x, rect.y, rect.width, rect.height)
    // PolygonShape.prototype._traceLinearPath.call({ pointsToTrace: this.getUnrotateShapeBounds().getCorners() }, context)

    // context.closePath()
    context.stroke()
    context.restore()
  }

  private _getPointsByComputeBounds(params: GetBoundsParams) {
    if (params.skipTransform) return this.initialPoints

    const matrix = params.skipWorldTransform
      ? this.localMatrix
      : Matrix3x3.compose(this.worldMatrix, this.localMatrix)

    return this.initialPoints.map(matrix.applyToPoint.bind(matrix))
  }

  private _shouldRenderStraightEdges(): boolean {
    return this.pointsToTrace.length < 3 || this.tension === 0
  }

  public traceLinearPath(context: CanvasRenderingContext2D): void {
    context.moveTo(this.pointsToTrace[0].x, this.pointsToTrace[0].y)
    this.pointsToTrace.forEach((point) => context.lineTo(point.x, point.y))
  }

  public traceSplinePath(context: CanvasRenderingContext2D): void {
    const length = this.pointsToTrace.length

    context.moveTo(this.pointsToTrace[0].x, this.pointsToTrace[0].y)

    for (let i = 1; i < length; i += 3) {
      const p1 = this.pointsToTrace[i]
      const p2 = this.pointsToTrace[i + 1]
      const p3 = this.pointsToTrace[i + 2]

      context.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)
    }
  }
}