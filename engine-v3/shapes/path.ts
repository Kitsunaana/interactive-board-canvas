import type { Point } from "../types";
import { Shape } from "./shape";

export class Path extends Shape {
  private readonly _points: Array<Point>

  public constructor(startPoint: Point) {
    super()
    
    this._points = [startPoint]
  }

  public addPoint(point: Point) {
    this._points.push(point)
  }

  public draw(context: CanvasRenderingContext2D) {
    const path = this._points
    
    context.lineWidth = 4
    context.strokeStyle = "rgba(0,0,0,0.5)"

    context.beginPath()
    context.moveTo(path[0].x, path[0].y)
    path.forEach(point => context.lineTo(point.x, point.y))
    context.stroke()
  }
}