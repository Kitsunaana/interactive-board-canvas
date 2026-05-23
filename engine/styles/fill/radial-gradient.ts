import { Point, type PointData } from "../../maths"
import { BaseGradient } from "./base-gradient"

export class RadialGradient extends BaseGradient {
  private _startPoint: Point = new Point(0, 0)
  private _endPoint: Point = new Point(0, 0)
  private _startRadius: number = 0
  private _endRadius: number = 0

  public get startPoint(): Point {
    return this._startPoint
  }

  public get endPoint(): Point {
    return this._endPoint
  }

  public get startRadius(): number {
    return this._startRadius
  }

  public get endRadius(): number {
    return this._endRadius
  }

  public setStartPoint(point: PointData): this {
    this._startPoint.copyFrom(this.component.getBounds().center.add(point))
    this.markDirty()
    return this
  }

  public setEndPoint(point: PointData): this {
    this._endPoint.copyFrom(this.component.getBounds().center.add(point))
    this.markDirty()
    return this
  }

  public setStartRadius(radius: number): this {
    this._startRadius = radius
    this.markDirty()
    return this
  }

  public setEndRadius(radius: number): this {
    this._endRadius = radius
    this.markDirty()
    return this
  }

  public computeGradient(context: CanvasRenderingContext2D): CanvasGradient {
    const gradient = context.createRadialGradient(
      this._startPoint.x,
      this._startPoint.y,
      this._startRadius,
      this._endPoint.x,
      this._endPoint.y,
      this._endRadius
    )

    this.applyColorStops(gradient)

    return gradient
  }
}
