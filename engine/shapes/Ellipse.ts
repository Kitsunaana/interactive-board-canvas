import { Matrix3x3, Point, type PointData, Rectangle } from "../maths";
import { Ellipse } from "../maths/Ellipse";
import { type GetBoundsParams } from "../world/sim-object";
import { Shape } from "./Shape";

export class EllipseShape extends Shape {
  public static isEllipse(candidate: unknown): candidate is EllipseShape {
    return candidate instanceof EllipseShape
  }

  public static computePointsToTrace(cx: number, cy: number, rx: number, ry: number): Array<PointData> {
    const K = 4 * (Math.sqrt(2) - 1) / 3

    const transform = (x: number, y: number) => ({ x: cx + x, y: cy + y })

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

  public _initialPoints!: Array<PointData>
  public _pointsToTrace!: Array<PointData>

  public isListening: boolean = true

  public constructor(private _x: number, private _y: number, private _rx: number, private _ry: number) {
    super()

    // const bounds = Ellipse.getBounds(_x, _y, _rx, _ry)
    // const origin = bounds.center

    this._initialPoints = EllipseShape.computePointsToTrace(_x, _y, _rx, _ry)

    this._pointsToTrace = this._initialPoints.map(p => ({ ...p }))

    this.bindEvents()
    this.subscribe(this)

    // this.position = new Point(_x, _y)
  }

  public visible: boolean = true

  public get position(): Point {
    return this.getBounds().center.add(this._translate)
  }

  public set position(nextPos: PointData) {
    const delta = Point.fromData(nextPos).sub(this.position)
    this.translate(delta)
  }

  public get x() {
    return this.position.x
  }

  public get y() {
    return this.position.y
  }

  public getPoints(): Array<PointData> {
    return this._initialPoints
  }

  public updateAfterTransform(): void {
    // if (!this.isInteracting) {
    const matrix = this.worldMatrix

    this._initialPoints = EllipseShape.computePointsToTrace(this._x, this._y, this._rx, this._ry)
    this._pointsToTrace = this._initialPoints.map(matrix.applyToPoint.bind(matrix))
    // }
  }

  public radius(value: PointData) {
    this._rx = value.x
    this._ry = value.y
    this.updateAfterTransform()
  }

  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible) return
    
    context.save()
    if (this.isInteracting) context.translate(...this._translate.array())
    super.render(context)
    context.restore()
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    if (!this.visible) return

    if (this.isListening) {
      context.save()
      if (this.isInteracting) context.translate(...this._translate.array())
      super.renderHit(context)
      context.restore()
    }
  }

  public getBounds(params: GetBoundsParams = {}): Rectangle {
    const matrix = params.skipTransform
      ? Matrix3x3.identity()
      : Matrix3x3.compose(this.worldMatrix)

    return Ellipse.getBounds(this._x, this._y, this._rx, this._ry, matrix)
  }

  public getUnrotateBounds(): Rectangle {
    const rotateOrigin = this.getInWorldOriginPosition("rotate")
    const unrotate = Matrix3x3.aroundOrigin(rotateOrigin, () => Matrix3x3.rotate(-this.getCurrentAngle()))
    const matrix = Matrix3x3.compose(unrotate, this.worldMatrix)

    return Ellipse.getBounds(this._x, this._y, this._rx, this._ry, matrix)
  }

  public tracePath(context: CanvasRenderingContext2D): void {
    const length = this._pointsToTrace.length

    context.beginPath()
    context.moveTo(this._pointsToTrace[0].x, this._pointsToTrace[0].y)

    for (let i = 1; i < length; i += 3) {
      const p1 = this._pointsToTrace[i]
      const p2 = this._pointsToTrace[(i + 1) % length]
      const p3 = this._pointsToTrace[(i + 2) % length]

      context.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)
    }

    context.closePath()
  }
}