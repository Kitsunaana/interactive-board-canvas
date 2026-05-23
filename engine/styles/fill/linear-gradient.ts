import { Point, type PointData } from "../../maths";
import { BaseGradient } from "./base-gradient";

export class LinearGradient extends BaseGradient {
  private _startPoint: Point = new Point(0, 0)
  private _endPoint: Point = new Point(0, 0)

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

  public computeGradient(context: CanvasRenderingContext2D): CanvasGradient {
    const gradient = context.createLinearGradient(
      ...this._startPoint.array(),
      ...this._endPoint.array(),
    )

    this.applyColorStops(gradient)

    return gradient
  }
}