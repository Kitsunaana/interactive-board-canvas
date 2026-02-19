import * as Maths from "../math";
import type { Group } from "./group";
import { type NodeConfig } from "./node";

export type PolygonConfig = NodeConfig & {
  points: Maths.PointData[],
  x?: number
  y?: number
}

export class PolygonV2 {
  private readonly _type = "Shape" as const

  public __parent: Group | null = null

  public boundsSkippedRotate: Maths.Rectangle

  private _needUpdate: boolean = true

  private readonly _math: Maths.Polygon
  private readonly _matrix: Maths.Matrix = new Maths.Matrix()
  private readonly _bounds: Maths.Rectangle = new Maths.Rectangle()

  private readonly _position: Maths.PointData = {
    x: 0,
    y: 0,
  }

  constructor(config: PolygonConfig) {
    this._math = new Maths.Polygon(config.points)

    this._position.x = config.x ?? 0
    this._position.y = config.y ?? 0

    this.boundsSkippedRotate = this._math.getBounds()
  }

  private readonly __listeners: Array<Function> = []
  public __onUpdate(callback: () => void) {
    this.__listeners.push(callback)
  }

  public __update() {
    this.__listeners.forEach(listener => listener())
  }

  public getType() {
    return this._type
  }

  public getParent() {
    return this.__parent
  }

  public rotate(angle: number): void {
    const bounds = this.boundsSkippedRotate

    this._matrix
      .clear()
      .setPivot(bounds.centerX, bounds.centerY)
      .rotate(angle)

    this._math.applyMatrix(this._matrix)
    this.__update()
  }

  public contains(point: Maths.PointData): boolean {
    return this._math.contains(point.x + this._position.x, point.y + this._position.y)
  }

  public getClientRect(): Maths.Rectangle {
    if (this._needUpdate) {
      this._math.getBounds(this._bounds)
      this._bounds.x += this._position.x
      this._bounds.y += this._position.y
    }

    return this._bounds
  }

  public __debugDrawShape(context: CanvasRenderingContext2D) {
    context.save()
    context.lineWidth = 3
    context.strokeStyle = "#e87123"
    context.beginPath()

    this._math.points.forEach((point) => context.lineTo(point.x + this._position.x, point.y + this._position.y))

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
    const bounds = this.boundsSkippedRotate

    context.save()
    context.strokeStyle = "red"
    context.beginPath()
    context.arc(bounds.centerX, bounds.centerY, 5, 0, Math.PI * 2)
    context.closePath()
    context.stroke()
    context.restore()
  }

  public draw(context: CanvasRenderingContext2D): void {
    this.__debugDrawBounds(context)
    this.__drawCenterBounds(context)
    this.__debugDrawShape(context)

    context.save()
    context.translate(this._position.x, this._position.y)

    context.beginPath()
    this._math.points.forEach((point) => context.lineTo(point.x, point.y))
    context.closePath()
    context.stroke()

    context.restore()
  }
}