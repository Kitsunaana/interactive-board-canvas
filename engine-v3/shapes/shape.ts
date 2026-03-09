import { clone } from "lodash"
import { Point, type PointData } from "../Point"

const generateColorId = () => {
  return Math.floor(Math.random() * 16_777_216)
}

export type ShapeOptions = {
  strokeColor: string
  strokeWidth: number
  fillColor: string
  fill: boolean
}

export type ShapeTransform = {
  translate: PointData
  scale: PointData
}

const initialTransform: ShapeTransform = {
  translate: Point.emptyPoint(),
  scale: Point.emptyPoint(1)
}

export abstract class Shape {
  public id: number = generateColorId()
  public selected: boolean = false
  public dirty: boolean = false

  public readonly transform: ShapeTransform = clone(initialTransform)

  public abstract draw(context: CanvasRenderingContext2D): void
  public abstract drawHitRegion(context: CanvasRenderingContext2D): void
  public abstract applyTranslate(): void

  constructor(public readonly options: ShapeOptions) {}

  public setTranslate(point: PointData) {
    this.transform.translate.x = point.x
    this.transform.translate.y = point.y
  }

  public hitTest(context: CanvasRenderingContext2D, point: PointData) {
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
    const options = this.options

    context.save()
    context.lineWidth = options.fill
      ? options.strokeWidth
      : Math.max(this.options.strokeWidth, 12)

    context.strokeStyle = color
    context.fillStyle = color

    if (this.options.fill) context.fill()

    context.stroke()
    context.restore()
  }

  protected applyStyles(context: CanvasRenderingContext2D) {
    context.save()
    context.strokeStyle = this.options.strokeColor
    context.lineWidth = this.options.strokeWidth
    context.fillStyle = this.options.fillColor

    if (this.options.fill) context.fill()
    context.stroke()
    context.restore()
  }
}