import {isUndefined} from "lodash"
import {Mixin} from "ts-mixer"
import {Group} from "../Group"
import * as Primitive from "../maths"
import {Polygon} from "../shapes/Polygon"

const {Point} = Primitive

export type ResizeHandler = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

export class Transformer extends Mixin(Group) {
  private readonly _pointsShape: Record<string, Primitive.PointData[]> = {}
  
  public readonly initialOBB = new Primitive.Rectangle()

  private readonly _handlePosition = new Point()
  private readonly _transformScale = new Point()
  private readonly _pivotPosition = new Point()
  private readonly _worldPivot = new Point()


  public get angle() {
    const children = this.getChildren()
    const isMultiple = children.length > 1

    return isMultiple ? 0 : children[0].angle
  }

  public setInitialPoints(): void {
    this.getChildren().forEach((shape) => {
      if (shape instanceof Polygon) {
        this._pointsShape[shape.id] = shape.math.points.map((point) => ({...point}))
      }
    })
  }

  public get center(): Primitive.PointData {
    return {
      x: this.initialOBB.centerX,
      y: this.initialOBB.centerY,
    }
  }

  public setWorldPivot(): void {
    Point.add(this.center, Point.rotate(this._pivotPosition, this.angle), this._worldPivot)
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
    const handle = this._handlePosition
    const pivot = this._pivotPosition

    const delta = Point.substract(currentPointer, this.center)
    const localPointer = Point.rotate(delta, -this.angle)
    const denom = Point.substract(handle, pivot)

    let scaleX = denom.x !== 0 ? (localPointer.x - pivot.x) / denom.x : 1
    let scaleY = denom.y !== 0 ? (localPointer.y - pivot.y) / denom.y : 1

    scaleX = Math.sign(scaleX) * Math.max(0.01, Math.abs(scaleX))
    scaleY = Math.sign(scaleY) * Math.max(0.01, Math.abs(scaleY))

    this._transformScale.set(scaleX, scaleY)
  }

  public applyTransform(): void {
    const center = this.center

    this.getChildren().forEach((child) => {
      if (child instanceof Polygon) {
        const points = this._pointsShape[child.id]
        if (isUndefined(points)) return

        child.math.points = points.map((point) => {
          const delta = Point.substract(point, center)
          const local = Point.rotate(delta, -this.angle)
          const dLocal = Point.substract(local, this._pivotPosition)
          const scaled = Point.multiple(dLocal, this._transformScale)

          return Point.add(this._worldPivot, Point.rotate(scaled, this.angle))
        })
      }
    })
  }
}
