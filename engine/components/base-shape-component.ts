import { type PointData, Rectangle, type ShapePrimitive } from "../maths"
import { BaseComponent } from "./base-component"
import { BaseGradient } from "../styles/fill/base-gradient"

export abstract class BaseShapeComponent extends BaseComponent {
  public abstract render(context: CanvasRenderingContext2D): void
  public abstract update(time: number): void

  protected abstract _primitive: ShapePrimitive

  protected _gradient: BaseGradient | null = null
  
  public lineWidth: number = 10
  public fillColor: string = "red"
  public strokeColor: string = "blue"

  public setGradient(gradient: BaseGradient): void {
    this._gradient = gradient
    this._gradient.setComponent(this)
  }

  public getBounds(): Rectangle {
    const bounds = this._primitive.getBounds()

    bounds.x -= this.lineWidth / 2
    bounds.y -= this.lineWidth / 2
    bounds.width += this.lineWidth
    bounds.height += this.lineWidth

    return bounds
  }

  public getCorners(): Array<PointData> {
    return this.getBounds().getCorners()
  }

  public applyMainStyles(context: CanvasRenderingContext2D): void {
    context.fillStyle = this._gradient ? this._gradient.getGradient(context) : this.fillColor
    context.lineWidth = this.lineWidth
    context.strokeStyle = this.strokeColor
  }
}
