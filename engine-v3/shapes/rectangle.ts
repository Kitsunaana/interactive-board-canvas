import type { Point, RectangleShape } from "../types";
import { Shape } from "./shape";

export type RectangleOptions = {
  lineWidth: number
  stroke: string
  fill: string
}

export class Rectangle extends Shape {
  private readonly _rectangle: RectangleShape

  public dirty = false

  public start: Point
  public end: Point

  public constructor(start: Point, private readonly _options: RectangleOptions) {
    super()

    this.start = start
    this.end = start

    this._rectangle = this.getRectangleFromCorner()
  }

  public setEnd(point: Point): void {
    this.end = point
    this.dirty = true
  }

  public getRectangleFromCorner(out?: Partial<RectangleShape>): RectangleShape {
    const minX = Math.min(this.start.x, this.end.x)
    const minY = Math.min(this.start.y, this.end.y)
    const maxX = Math.max(this.start.x, this.end.x)
    const maxY = Math.max(this.start.y, this.end.y)

    const width = maxX - minX
    const height = maxY - minY

    out ||= {}

    out.type = "rectangle"
    out.height = height
    out.width = width
    out.x = minX
    out.y = minY

    return out as RectangleShape
  }

  public getRectangle(): RectangleShape {
    if (this.dirty) {
      this.getRectangleFromCorner(this._rectangle)
      this.dirty = false
    }

    return this._rectangle
  }

  public draw(context: CanvasRenderingContext2D): void {
    const rectangle = this.getRectangle()

    context.strokeStyle = this._options.stroke
    context.lineWidth = this._options.lineWidth
    context.fillStyle = this._options.fill

    context.beginPath()
    context.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height)
    context.fill()
    context.stroke()
  }
}