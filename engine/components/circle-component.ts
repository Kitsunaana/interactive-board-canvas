import { Circle, Point } from "../maths"
import { BackgroundImage } from "../styles/background-image"
import { BaseShapeComponent } from "./base-shape-component"

const sources = {
  // darthVader: 'https://konvajs.org/assets/darth-vader.jpg',
  darthVader: 'https://i.pinimg.com/originals/02/25/2e/02252e85fef76ab07d9536d39056cead.jpg',
  yoda: 'https://konvajs.org/assets/yoda.jpg',
}

export class CircleComponent extends BaseShapeComponent {
  protected _geometry: Circle

  public constructor(public x: number, public y: number, public radius: number) {
    super()

    this._geometry = new Circle(x, y, radius)

    this.setBackgroundImage(
      new BackgroundImage()
        .setComponent(this)
        .setBackgroundImage(sources.darthVader)
        .setBackgroundRepeat("repeat")
        .setBackgroundSize("contain")
    )
  }

  public update(time: number): void { }

  public render(context: CanvasRenderingContext2D): void {
    const bounds = this.getBounds()

    context.save()
    context.beginPath()

    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    this.applyMainStyles(context)

    context.closePath()
    context.restore()
  }

  public renderHit(context: CanvasRenderingContext2D): void { }
}