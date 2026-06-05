import { type PointData, Rectangle, type ShapePrimitive } from "../maths"
import { BackgroundImage } from "../styles/background-image"
import { BaseGradient } from "../styles/gradient"
import { BaseComponent } from "./base-component"

export abstract class BaseShapeComponent extends BaseComponent {
  public abstract geometry: ShapePrimitive

  public backgroundImage: BackgroundImage | null = null
  public gradient: BaseGradient | null = null
  
  public lineWidth: number = 1
  public fillColor: string = "red"
  public strokeColor: string = "blue"

  public setGradient(gradient: BaseGradient): void {
    this.gradient = gradient
    this.gradient.setComponent(this)
  }

  public setBackgroundImage(backgroundImage: BackgroundImage): void {
    this.backgroundImage = backgroundImage
    this.backgroundImage.setComponent(this)
  }

  public getBounds(): Rectangle {
    const bounds = this.geometry.getBounds()

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
    context.fillStyle = this.gradient ? this.gradient.getGradient(context) : this.fillColor
    
    const backgroundImage = this.backgroundImage?.getImagePattern(context)
    context.fillStyle = backgroundImage ? backgroundImage : this.fillColor

    context.lineWidth = this.lineWidth
    context.strokeStyle = this.strokeColor
    
    context.fill()
    context.stroke()
  }
}
