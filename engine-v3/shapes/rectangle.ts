import type { Point, RectangleShape } from "../types";
import { Shape } from "./shape";

export type RectangleOptions = {
  strokeColor: string
  strokeWidth: number
  fillColor: string
  fill: boolean
}

export class Rectangle extends Shape {
  private readonly _rectangle: RectangleShape

  public dirty = false

  public start: Point
  public end: Point

  public constructor(start: Point, options: RectangleOptions) {
    super(options)

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

  public drawHitRegion(context: CanvasRenderingContext2D) {
    const rectangle = this.getRectangle()

    context.beginPath()
    context.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height)

    this.applyHitRegionStyles(context)
  }

  public draw(context: CanvasRenderingContext2D): void {
    const rectangle = this.getRectangle()

    context.beginPath()
    context.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height)

    this.applyStyles(context)
    if (this.selected)
      this.drawGizmo(context)
  }

  public drawGizmo(context: CanvasRenderingContext2D) {
    const padding = 5
    const rectangle = this.getRectangle()
    const rectWithPadding = {
      x: rectangle.x - padding,
      y: rectangle.y - padding,
      width: rectangle.width + padding * 2, 
      height: rectangle.height + padding * 2, 
    }

    const { x, y, width, height } = rectWithPadding

    context.beginPath()
    context.rect(x, y, width, height)

    context.strokeStyle = "black"
    context.setLineDash([5, 5])
    context.stroke()

    context.setLineDash([])
  }
}