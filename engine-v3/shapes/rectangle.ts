import { Point, type PointData } from "../Point";
import type { RectangleShape } from "../types";
import type { PathOptions } from "./path";
import { Shape } from "./shape";

export class Rectangle extends Shape {
  private readonly _rectangle: RectangleShape

  public start: PointData
  public end: PointData

  public constructor(start: PointData, options: PathOptions) {
    super(options)

    this.start = start
    this.end = start

    this._rectangle = this.getRectangleFromCorner()
  }

  public setEnd(point: PointData): void {
    this.end = point
    this.dirty = true
  }

  public applyTranslate(): void {
    this.dirty = true

    Point.addPoints(this.start, this.transform.translate)
    Point.addPoints(this.end, this.transform.translate)

    this.transform.translate.x = 0
    this.transform.translate.y = 0
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
    const translate = this.transform.translate
    const rectangle = this.getRectangle()

    context.save()
    context.beginPath()
    context.translate(translate.x, translate.y)
    context.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height)

    context.restore()
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
    const translate = this.transform.translate

    context.save()
    context.beginPath()
    context.translate(translate.x, translate.y)
    context.rect(x, y, width, height)

    context.strokeStyle = "black"
    context.setLineDash([5, 5])
    context.stroke()

    context.restore()
  }
}