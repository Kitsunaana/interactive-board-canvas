import { Mixin } from "ts-mixer"
import { Group } from "../Group"
import * as Primitive from "../maths"
import { Polygon } from "../shapes/Polygon"
import { clone } from "lodash"

const { Point } = Primitive

export type ResizeHandler = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

export class Transformer extends Mixin(Group) {
  private readonly _pointsShape: Record<string, Primitive.PointData[]> = {}
  private readonly _originsShape: Record<string, { originScale: Primitive.PointData, originRotate: Primitive.PointData }> = {}

  public initialOBB = new Primitive.Rectangle()

  private readonly _handlePosition = new Point()
  private readonly _transformScale = new Point(1, 1)
  private readonly _pivotPosition = new Point()
  private readonly _worldPivot = new Point()
  private readonly _obbWorldCenter = new Point()

  public get center(): Primitive.PointData {
    return this._obbWorldCenter
  }

  public get angle() {
    const children = this.getChildren()
    if (children.length === 0) return 0

    const isMultiple = children.length > 1

    return isMultiple ? Math.PI / 4 : children[0].getAngle()
  }

  public setInitialState(): void {
    const angle = this.angle
    const allPoints: Primitive.PointData[] = []

    this.getChildren().forEach((shape) => {
      if (shape instanceof Polygon) {
        this._pointsShape[shape.id] = shape.points.map((point) => ({
          ...point,
        }))

        this._originsShape[shape.id] = {
          originScale: clone(shape.originScale),
          originRotate: clone(shape.originRotate),
        }

        allPoints.push(...shape.points.map(point => ({ ...point })))
      }
    })

    Primitive.Polygon.rotate(allPoints, -angle, new Primitive.Point())

    const bounds = Primitive.Polygon.prototype.getBounds.call({ points: allPoints })

    this.initialOBB.copyFrom(bounds)
    this._obbWorldCenter.copyFrom(Point.rotate(bounds.center, angle))
  }

  public draw(context: CanvasRenderingContext2D): void {
    super.draw(context)

    const obb = this.initialOBB
    const angle = this.angle

    context.save()
    context.translate(this._obbWorldCenter.x, this._obbWorldCenter.y)
    context.rotate(angle)
    context.beginPath()
    context.strokeRect(-obb.width / 2, -obb.height / 2, obb.width, obb.height)
    context.beginPath()
    context.restore()

    context.arc(this._worldPivot.x, this._worldPivot.y, 5, 0, Math.PI * 2)
    context.fill()
  }

  public setWorldPivot(): void {
    const rotated = Point.rotate(this._pivotPosition, this.angle)
    const world = Point.add(this.center, rotated)

    this._worldPivot.copyFrom(world)
  }

  public setHandlePosition(side: ResizeHandler): void {
    const halfW = this.initialOBB.width / 2
    const halfH = this.initialOBB.height / 2

    let handleX = 0
    let handleY = 0

    switch (side) {
      case "nw":
        handleX = -halfW;
        handleY = -halfH;
        break
      case "n":
        handleX = 0;
        handleY = -halfH;
        break
      case "ne":
        handleX = halfW;
        handleY = -halfH;
        break
      case "e":
        handleX = halfW;
        handleY = 0;
        break
      case "se":
        handleX = halfW;
        handleY = halfH;
        break
      case "s":
        handleX = 0;
        handleY = halfH;
        break
      case "sw":
        handleX = -halfW;
        handleY = halfH;
        break
      case "w":
        handleX = -halfW;
        handleY = 0;
        break
    }

    this._handlePosition.set(handleX, handleY)
  }

  public setPivotPosition(side: ResizeHandler): void {
    const halfW = this.initialOBB.width / 2
    const halfH = this.initialOBB.height / 2

    let pivotX = 0
    let pivotY = 0

    switch (side) {
      case "nw":
        pivotX = halfW;
        pivotY = halfH;
        break
      case "n":
        pivotX = 0;
        pivotY = halfH;
        break
      case "ne":
        pivotX = -halfW;
        pivotY = halfH;
        break
      case "e":
        pivotX = -halfW;
        pivotY = 0;
        break
      case "se":
        pivotX = -halfW;
        pivotY = -halfH;
        break
      case "s":
        pivotX = 0;
        pivotY = -halfH;
        break
      case "sw":
        pivotX = halfW;
        pivotY = -halfH;
        break
      case "w":
        pivotX = halfW;
        pivotY = 0;
        break
    }

    this._pivotPosition.set(pivotX, pivotY)
  }

  public setTransformScale(currentPointer: Primitive.PointData): void {
    const delta = Point.subtract(currentPointer, this._worldPivot)
    const localPointer = Point.rotate(delta, -this.angle)

    const denom = Point.subtract(this._handlePosition, this._pivotPosition)

    let sx = denom.x !== 0 ? localPointer.x / denom.x : 1
    let sy = denom.y !== 0 ? localPointer.y / denom.y : 1

    sx = Math.sign(sx) * Math.max(0.01, Math.abs(sx))
    sy = Math.sign(sy) * Math.max(0.01, Math.abs(sy))

    this._transformScale.set(sx, sy)
  }

  public applyTransform(): void {
    const isSingle = this.getChildren().length === 1

    this.getChildren().forEach((child) => {
      if (!(child instanceof Polygon)) return;

      const initialPoints = this._pointsShape[child.id];
      const initialOrigins = this._originsShape[child.id];
      const childAngle = child.getAngle()

      if (isSingle) {
        const initOriginScale = initialOrigins.originScale
        const initOriginRotate = initialOrigins.originRotate

        const unrotatedOriginScale = Primitive.rotatePointAroundOrigin(initOriginScale, initOriginRotate, -childAngle)

        const newOriginRotate = Primitive.scalePointAroundOrigin(initOriginRotate, unrotatedOriginScale, this._transformScale)
        const newOriginScale = Primitive.rotatePointAroundOrigin(unrotatedOriginScale, newOriginRotate, childAngle)

        child.points = initialPoints.map((point) => {
          Point.rotate(Point.subtract(point, initOriginRotate), -childAngle, point)
          Point.add(point, initOriginRotate, point)

          Point.multiple(Point.subtract(point, this._transformScale), unrotatedOriginScale, point)
          Point.add(point, this._transformScale, point)

          Point.rotate(Point.subtract(point, newOriginRotate), childAngle, point)
          Point.add(point, newOriginRotate, point)

          return point
        })

        child.originScale.copyFrom(newOriginScale)
        child.originRotate.copyFrom(newOriginRotate)
      } else {
        const groupAngle = this.angle

        const scaleOriginInLocal = (origin: Primitive.PointData) => {
          const vec = Point.subtract(origin, this._worldPivot)
          const local = Point.rotate(vec, -groupAngle)
          const scaled = Point.multiple(local, this._transformScale)
          const world = Point.rotate(scaled, groupAngle)

          return Point.add(this._worldPivot, world)
        }

        child.points = initialPoints.map(scaleOriginInLocal)

        child.originScale.copyFrom(scaleOriginInLocal(initialOrigins.originScale))
        child.originRotate.copyFrom(scaleOriginInLocal(initialOrigins.originRotate))
      }
    })
  }
}
