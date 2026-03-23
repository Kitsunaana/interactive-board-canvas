import { Mixin } from "ts-mixer"
import { Group } from "../Group"
import * as Primitive from "../maths"
import { Polygon } from "../shapes/Polygon"

const { Point } = Primitive

export type ResizeHandler = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

export class Transformer extends Mixin(Group) {
  private readonly _pointsShape: Record<string, Primitive.PointData[]> = {}

  public initialOBB = new Primitive.Rectangle()

  private readonly _handlePosition = new Point()
  private readonly _transformScale = new Point(1, 1)
  private readonly _pivotPosition = new Point()
  private readonly _worldPivot = new Point()

  public get center(): Primitive.PointData {
    return {
      x: this.initialOBB.centerX,
      y: this.initialOBB.centerY,
    }
  }

  public get angle() {
    const children = this.getChildren()
    if (children.length === 0) return 0

    const isMultiple = children.length > 1

    return isMultiple ? 0 : children[0].getAngle()
  }

  public setInitialState(): void {
    this.initialOBB = this.getClientRect()

    this.getChildren().forEach((shape) => {
      if (shape instanceof Polygon) {
        this._pointsShape[shape.id] = shape.math.points.map((point) => ({
          ...point,
        }))
      }
    })
  }

  public draw(context: CanvasRenderingContext2D): void {
    super.draw(context)

    const obb = this.initialOBB

    context.save()
    context.beginPath()
    context.strokeRect(obb.x, obb.y, obb.width, obb.height)
    context.beginPath()
    context.arc(this._worldPivot.x, this._worldPivot.y, 5, 0, Math.PI * 2)
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
    this.getChildren().forEach((child) => {
      if (!(child instanceof Polygon)) return;

      const initialLocal = this._pointsShape[child.id];

      child.math.points = initialLocal.map((localPt) => {
        const rotatedLocal = Point.rotate(localPt, this.angle);
        const worldPt = Point.add(child.originScale, rotatedLocal);

        const vecFromPivot = Point.subtract(worldPt, this._worldPivot);
        const scaledVec = Point.multiple(vecFromPivot, this._transformScale);

        const newWorldPt = Point.add(this._worldPivot, scaledVec);
        const toOrigin = Point.subtract(newWorldPt, child.originScale);

        return Point.rotate(toOrigin, -this.angle);
      });
    });
  }
}
