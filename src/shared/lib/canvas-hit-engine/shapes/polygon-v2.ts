import * as Maths from "../math";
import { Node, type NodeConfig } from "./node";

export type PolygonConfig = NodeConfig & {
  points: Maths.PointData[],
}

export class PolygonV2 extends Node {
  public boundsSkippedRotate: Maths.Rectangle

  private _needUpdate: boolean = true

  private readonly _math: Maths.Polygon
  private readonly _matrix: Maths.Matrix = new Maths.Matrix()
  private readonly _bounds: Maths.Rectangle = new Maths.Rectangle()

  constructor(config: PolygonConfig) {
    super({})

    this._math = new Maths.Polygon(config.points)

    this.boundsSkippedRotate = this._math.getBounds()
  }

  public rotate(angle: number): void {
    const bounds = this.boundsSkippedRotate

    this._matrix
      .clear()
      .setPivot(bounds.centerX, bounds.centerY)
      .rotate(angle)

    this._math.applyMatrix(this._matrix)
  }

  public contains(point: Maths.PointData): boolean {
    return this._math.contains(point.x, point.y)
  }

  public getClientRect(): Maths.Rectangle {
    if (this._needUpdate) this._math.getBounds(this._bounds)
    return this._bounds
  }

  public __debugDrawShape(context: CanvasRenderingContext2D) {
    context.save()
    context.lineWidth = 3
    context.strokeStyle = "#e87123"
    context.beginPath()

    this._math.points.forEach((point) => context.lineTo(point.x, point.y))

    context.closePath()
    context.stroke()
    context.restore()
  }

  public __debugDrawBounds(context: CanvasRenderingContext2D) {
    const bounds = this.getClientRect()

    context.save()
    context.strokeStyle = "red"
    context.beginPath()
    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    context.closePath()
    context.restore()
  }

  public __drawCenterBounds(context: CanvasRenderingContext2D) {
    const bounds = this.getClientRect()

    context.save()
    context.strokeStyle = "red"
    context.beginPath()
    context.arc(bounds.centerX, bounds.centerY, 5, 0, Math.PI * 2)
    context.closePath()
    context.stroke()
    context.restore()
  }

  public draw(context: CanvasRenderingContext2D): void {
    this.__debugDrawShape(context)
    this.__debugDrawBounds(context)
    this.__drawCenterBounds(context)

    context.save()
    context.beginPath()

    this._math.points.forEach((point) => context.lineTo(point.x, point.y))

    context.closePath()
    context.stroke()
    context.restore()
  }
}