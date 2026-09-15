import { Matrix3x3, Point, type PointData, Polygon, Rectangle } from "../maths";
import { type GetBoundsParams } from "../world/sim-object";
import { Shape } from "./Shape";

export class CircleShape extends Shape {
  public static isCirlce(candidate: unknown): candidate is CircleShape {
    return candidate instanceof CircleShape
  }

  public static computePointsToTrace(x: number, y: number, radius: number): Array<PointData> {
    return [
      { x: x - radius, y: y - radius },
      { x: x + radius, y: y - radius },
      { x: x + radius, y: y + radius },
      { x: x - radius, y: y + radius },
    ]
  }

  public _initialPoints: Array<PointData>
  public _pointsToTrace: Array<PointData>

  public isListening: boolean = true

  public constructor(private _x: number, private _y: number, private _radius: number) {
    super()

    this._initialPoints = CircleShape.computePointsToTrace(_x, _y, _radius)
    this._pointsToTrace = this._initialPoints.map((point) => ({ ...point }))
  }

  public get position(): Point {
    return this.getBounds().center.add(this._translate)
  }

  public set position(nextPos: PointData) {
    this.translate(Point.fromData(nextPos).sub(this.position))
  }

  public getPoints(): Array<PointData> {
    return this._initialPoints
  }

  public updateAfterTransform(): void {
    if (!this.isInteracting) {
      const matrix = this.worldMatrix

      this._initialPoints = CircleShape.computePointsToTrace(this._x, this._y, this._radius)
      this._pointsToTrace = this._initialPoints.map(matrix.applyToPoint.bind(matrix))
    }
  }

  public radius(value: number) {
    this._radius = value
    this.updateAfterTransform()
  }

  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible) return
    context.betweenSaveAndRestore(() => super.render(context))
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    if (!this.visible) return
    if (this.isListening) context.betweenSaveAndRestore(() => super.renderHit(context))
  }

  public getBounds(params: GetBoundsParams = {}): Rectangle {
    if (params.skipTransform) return new Polygon(this._pointsToTrace).getBounds()
    const points = this._initialPoints.map((point) => this.worldMatrix.applyToPoint(point))
    return new Polygon(points).getBounds()
  }

  public getUnrotateBounds(): Rectangle {
    const rotateOrigin = this.getInWorldOriginPosition("rotate")
    const unrotate = Matrix3x3.aroundOrigin(rotateOrigin, () => Matrix3x3.rotate(-this.getCurrentAngle()))
    const matrix = Matrix3x3.compose(unrotate, this.worldMatrix)

    return new Polygon(this._pointsToTrace.map(matrix.applyToPoint.bind(matrix))).getBounds()
  }

  public tracePath(context: CanvasRenderingContext2D): void {
    const bounds = this.getBounds().center
    const radius = this._radius

    // console.log(bounds.x, bounds.y)

    context.beginPath()
    context.arc(bounds.x, bounds.y, radius, 0, Math.PI * 2, false)
    context.closePath()
  }
}