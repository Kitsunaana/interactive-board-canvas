import { Circle } from "../maths"
import { BaseShapeComponent } from "./base-shape-component"
import { RadialGradient } from "../styles/fill/radial-gradient"

export class CircleComponent extends BaseShapeComponent {
  protected _primitive: Circle

  public constructor(public x: number, public y: number, public radius: number) {
    super()

    this._primitive = new Circle(x, y, radius)

    this._gradient = new RadialGradient()
      .setComponent(this)
      .setStartPoint({ x: 0, y: 0 })
      .setEndPoint({ x: 0, y: 0 })
      .setStartRadius(0)
      .setEndRadius(60)
      .setColorStops([0, 'red', 0.5, 'yellow', 1, 'blue'])
  }

  public update(time: number): void {}

  public render(context: CanvasRenderingContext2D): void {
    const bounds = this.getBounds()

    context.save()
    context.beginPath()

    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

    this.applyMainStyles(context)

    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    context.fill()
    context.stroke()
    context.closePath()
    context.restore()
  }

  public renderHit(context: CanvasRenderingContext2D): void {
  }
}