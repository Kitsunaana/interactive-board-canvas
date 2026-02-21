import { defaultTo, isNull } from "lodash"
import { Node, Primitive, type NodeConfig } from "../../../../../engine"

export interface PolygonConfig extends NodeConfig {
  points: Primitive.PointData[],
  name?: string
  x?: number
  y?: number
}

export class PolygonV2 extends Node {
  public _absolutePositionCursor: Primitive.PointData = {
    x: 0,
    y: 0,
  }

  private readonly _type = "Shape" as const

  public boundsSkippedRotate: Primitive.Rectangle

  private readonly _math: Primitive.Polygon
  private readonly _matrix: Primitive.Matrix = new Primitive.Matrix()
  private readonly _bounds: Primitive.Rectangle = new Primitive.Rectangle()

  public update() {
    this._needUpdate = true
  }

  public get absolutePositionCursor() {
    return isNull(this.parent())
      ? this._absolutePositionCursor
      : this.parent().absolutePositionCursor
  }

  constructor(config: PolygonConfig) {
    super()

    if (defaultTo(config.isDraggable, true)) {
      this.init(this)
      this.attach(this)
    }

    this._name = config.name
    this._math = new Primitive.Polygon(config.points)

    this.boundsSkippedRotate = this._math.getBounds()

    this.position({
      x: config.x ?? 0,
      y: config.y ?? 0,
    })
  }

  public getType() {
    return this._type
  }

  public rotate(angle: number): void {
    const bounds = this.boundsSkippedRotate

    this._matrix
      .clear()
      .setPivot(bounds.centerX, bounds.centerY)
      .rotate(angle)

    this._math.applyMatrix(this._matrix)
  }

  public contains(point: Primitive.PointData): boolean {
    return this._math.contains(point.x - this.position().x, point.y - this.position().y)
  }

  public getClientRect(): Primitive.Rectangle {
    if (this._needUpdate) {
      this._math.getBounds(this._bounds)

      this._bounds.x += this.position().x
      this._bounds.y += this.position().y
    }

    return this._bounds
  }

  public __debugDrawShape(context: CanvasRenderingContext2D) {
    context.save()
    context.lineWidth = 3
    context.strokeStyle = "#e87123"
    context.beginPath()

    this._math.points.forEach((point) => context.lineTo(point.x + this.position().x, point.y + this.position().y))

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
    context.translate(this.position().x, this.position().y)

    context.beginPath()
    this._math.points.forEach((point) => context.lineTo(point.x, point.y))
    context.closePath()
    context.stroke()

    context.restore()
  }
}