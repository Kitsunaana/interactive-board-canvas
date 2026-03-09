import type { Point } from "../types";
import { Shape } from "./shape";

export type PathOptions = {
  strokeColor: string
  strokeWidth: number
  fillColor: string
  fill: boolean
}

export class Path extends Shape {
  private readonly _points: Array<Point>

  public constructor(startPoint: Point, options: PathOptions) {
    super(options)

    this._points = [startPoint]
  }

  public addPoint(point: Point) {
    this._points.push(point)
  }

  public drawHitRegion(context: CanvasRenderingContext2D): void {
    const path = this._points

    context.beginPath()
    context.moveTo(path[0].x, path[0].y)

    path.forEach(point => context.lineTo(point.x, point.y))

    this.applyHitRegionStyles(context)
  }

  public draw(context: CanvasRenderingContext2D) {
    const path = this._points

    context.beginPath()
    context.moveTo(path[0].x, path[0].y)

    path.forEach(point => context.lineTo(point.x, point.y))

    this.applyStyles(context)
    if (this.selected)
      this.drawGizmo(context)
  }

  public drawGizmo(context: CanvasRenderingContext2D) {
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

    context.beginPath()
    context.rect(x, y, width, height)

    context.strokeStyle = "black"
    context.setLineDash([5, 5])
    context.stroke()

    context.setLineDash([])
  }
}