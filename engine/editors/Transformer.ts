import { Mixin } from "ts-mixer"
import { Group } from "../Group"
import * as Primitive from "../maths"
import { Polygon } from "../shapes/Polygon"

const { Point } = Primitive

export type ResizeHandler = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

export class Transformer extends Mixin(Group) {
  private readonly _originsShape: Record<string, {
    originRotate: Primitive.PointData
    originScale: Primitive.PointData
    points: Array<Primitive.PointData>
  }> = {}

  public readonly initialOBB = new Primitive.Rectangle()

  private readonly _handlePosition = new Point()
  private readonly _transformScale = new Point(1, 1)
  private readonly _pivotPosition = new Point()
  private readonly _worldPivot = new Point()
  private readonly _obbWorldCenter = new Point()
  private readonly _padding = 7

  public get center(): Primitive.PointData {
    return this._obbWorldCenter
  }

  public get angle() {
    const children = this.getChildren()
    if (children.length === 0) return 0

    const isMultiple = children.length > 1

    if (isMultiple === false && children[0] instanceof Polygon) {
      return children[0].transformer.angle
    }

    return isMultiple ? 0.5 : 0
  }

  public setInitialState(): void {
    const angle = this.angle

    this.getChildren().forEach((shape) => {
      if (shape instanceof Polygon) {
        this._originsShape[shape.id] = {
          originRotate: shape.transformer.originRotate.clone(),
          originScale: shape.transformer.originScale.clone(),
          points: shape.getPoints(),
        }
      }
    })

    const points = this.getPoints()
    Primitive.Polygon.rotate(points, -angle, new Primitive.Point())

    const bounds = Primitive.Polygon.prototype.getBounds.call({ points: points })

    this.initialOBB.copyFrom(bounds)
    this._obbWorldCenter.copyFrom(Point.rotate(this.initialOBB.center, angle))
  }

  public draw(context: CanvasRenderingContext2D): void {
    super.draw(context)

    const points = this.getPoints()
    const clientRect = this.getClientRect()

    Polygon.rotate(points, -this.angle, clientRect.center)
    const corners = this.getBounds.call({ points }).padding(7).getCorner()

    Polygon.rotate(corners, this.angle, clientRect.center)

    context.save()
    corners.forEach((corner) => {
      context.beginPath()
      context.arc(corner.x, corner.y, 5, 0, Math.PI * 2, false)
      context.closePath()
      context.stroke()
      context.fill()
    })
    context.restore()

    context.save()
    context.beginPath()
    context.moveTo(corners[0].x, corners[0].y)
    corners.forEach((corner) => context.lineTo(corner.x, corner.y))
    context.closePath()
    context.stroke()
    context.restore()

    context.save()
    context.beginPath()
    context.arc(this._worldPivot.x, this._worldPivot.y, 5, 0, Math.PI * 2)
    context.closePath()
    context.fill()
    context.restore()
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
    const PADDING = this._padding
    const DEAD_ZONE = 2 * PADDING

    const delta = Point.subtract(currentPointer, this._worldPivot)
    const localPointer = Point.rotate(delta, -this.angle)

    const paddingOffset = {
      x: Math.sign(this._handlePosition.x) * PADDING,
      y: Math.sign(this._handlePosition.y) * PADDING,
    }

    const adjustedPointer = {
      x: localPointer.x - paddingOffset.x,
      y: localPointer.y - paddingOffset.y,
    }

    const denom = Point.subtract(this._handlePosition, this._pivotPosition)

    let sx = 1
    let sy = 1

    if (denom.x !== 0) {
      const raw = adjustedPointer.x / denom.x

      if (raw > 0) sx = Math.max(0.01, raw)
      else if (Math.abs(adjustedPointer.x) <= DEAD_ZONE) sx = 0.01
      else {
        const flipPointer = adjustedPointer.x + Math.sign(denom.x) * DEAD_ZONE
        sx = flipPointer / denom.x
        sx = Math.sign(sx) * Math.max(0.01, Math.abs(sx))
      }
    }

    if (denom.y !== 0) {
      const raw = adjustedPointer.y / denom.y

      if (raw > 0) sy = Math.max(0.01, raw)
      else if (Math.abs(adjustedPointer.y) <= DEAD_ZONE) sy = 0.01
      else {
        const flipPointer = adjustedPointer.y + Math.sign(denom.y) * DEAD_ZONE
        sy = flipPointer / denom.y
        sy = Math.sign(sy) * Math.max(0.01, Math.abs(sy))
      }
    }

    this._transformScale.set(sx, sy)
  }

  public applyTransform(): void {
    const isMultiple = this.getChildren().length > 1

    this
      .getChildren()
      .forEach((child) => {
        if (!(child instanceof Polygon)) return;

        const initialState = this._originsShape[child.id];
        const copied = initialState.points.map((point) => ({ ...point }))

        if (isMultiple) {
          child.transformer.originScale.copyFrom(this._worldPivot)
          child.transformer.angle = this.angle
        }

        child.transformer.applyToPoints(copied)
        child.transformer.scalePoints(this._transformScale)
        child.transformer.updateOriginRotate(initialState.originRotate, this._transformScale)


        child.points = copied
      })
  }
}
