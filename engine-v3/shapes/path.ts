import { Point, type PointData } from "../Point";
import type { RectangleShape } from "../types";
import { Shape } from "./shape";

export type PathOptions = {
  strokeColor: string
  strokeWidth: number
  fillColor: string
  fill: boolean
}

export class Path extends Shape {
  private readonly _points: Array<PointData> = []
  private readonly _innerBounds: RectangleShape = this.getBounds()

  public constructor(startPoint: PointData, options: PathOptions) {
    super(options)

    this._points = [startPoint]
  }

  public bounds() {
    if (this.dirty) {
      this.getBounds(this._innerBounds)
      this.dirty = false
    }

    return this._innerBounds
  }

  public addPoint(point: PointData) {
    this._points.push(point)
    this.dirty = true
  }

  public applyTranslate(): void {
    this.dirty = true

    this._points.forEach((point) => {
      Point.addPoints(point, this.transform.translate)
    })

    this.transform.translate.x = 0
    this.transform.translate.y = 0
  }

  public getBounds(out?: Partial<RectangleShape>) {
    const xList = this._points.map(point => point.x)
    const yList = this._points.map(point => point.y)

    const minX = Math.min(...xList)
    const minY = Math.min(...yList)
    const maxX = Math.max(...xList)
    const maxY = Math.max(...yList)

    const x = minX
    const y = minY
    const width = maxX - minX
    const height = maxY - minY

    out ||= {}

    out.x = x
    out.y = y
    out.width = width
    out.height = height
    out.type = "rectangle" as const

    return out as RectangleShape
  }

  public drawHitRegion(context: CanvasRenderingContext2D): void {
    const path = this._points

    context.beginPath()
    context.moveTo(path[0].x, path[0].y)

    path.forEach(point => context.lineTo(point.x, point.y))

    this.applyHitRegionStyles(context)
  }

  public draw(context: CanvasRenderingContext2D) {
    const translate = this.transform.translate
    const path = this._points

    context.save()
    context.beginPath()
    context.translate(translate.x, translate.y)
    context.moveTo(path[0].x, path[0].y)

    path.forEach(point => context.lineTo(point.x, point.y))

    context.restore()

    this.applyStyles(context)
    if (this.selected)
      this.drawGizmo(context)
  }

  public drawGizmo(context: CanvasRenderingContext2D) {
    const translate = this.transform.translate
    const { x, y, width, height } = this.bounds()

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