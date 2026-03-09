import type { Point } from "../types"

const generateColorId = () => {
  return Math.floor(Math.random() * 16_777_216)
}

export type ShapeOptions = {
  strokeColor: string
  strokeWidth: number
  fillColor: string
  fill: boolean
}

export abstract class Shape {
  public id: number = generateColorId()
  public selected: boolean = false

  public abstract draw(context: CanvasRenderingContext2D): void
  public abstract drawHitRegion(context: CanvasRenderingContext2D): void

  constructor(protected readonly _options: ShapeOptions) { }

  public hitTest(context: CanvasRenderingContext2D, point: Point) {
    const { data } = context.getImageData(point.x, point.y, 1, 1)
    const [red, green, blue] = data

    const id = red << 16 | green << 8 | blue

    return this.id === id
  }

  protected _getHitRegionColor() {
    return `#${this.id.toString(16)}`
  }

  protected applyHitRegionStyles(context: CanvasRenderingContext2D) {
    const color = this._getHitRegionColor()
    const options = this._options

    context.lineWidth = options.fill
      ? options.strokeWidth
      : Math.max(this._options.strokeWidth, 12)

    context.strokeStyle = color
    context.fillStyle = color

    if (this._options.fill) context.fill()

    context.stroke()
  }

  protected applyStyles(context: CanvasRenderingContext2D) {
    context.strokeStyle = this._options.strokeColor
    context.lineWidth = this._options.strokeWidth
    context.fillStyle = this._options.fillColor

    if (this._options.fill) context.fill()
    context.stroke()
  }
}