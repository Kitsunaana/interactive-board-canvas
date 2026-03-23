import { Node, type NodeConfig } from "../Node";
import * as Primitive from "../maths";
import { Point } from "../maths";

export interface PolygonConfig extends NodeConfig {
  points: Primitive.PointData[],
}

export class Polygon extends Node {
  private readonly _type = "Shape" as const

  
  public readonly originScale: Primitive.Point = new Primitive.Point()
  public readonly originRotate: Primitive.Point = new Primitive.Point()
  public readonly corners: Array<Primitive.PointData>
  public readonly math: Primitive.Polygon

  private readonly _bounds: Primitive.Rectangle = new Primitive.Rectangle()

  public get absolutePositionCursor() {
    return this.getParent()!.absolutePositionCursor
  }

  public constructor(config: PolygonConfig) {
    super(config)

    const bounds = Primitive.Polygon.prototype.getBounds.call(config)

    this.originScale.set(bounds.x, bounds.y)
    this.originRotate.set(bounds.centerX, bounds.centerY)

    this.math = new Primitive.Polygon(config.points)

    const scale: Primitive.PointData = {
      x: config.scaleX ?? 1,
      y: config.scaleY ?? 1,
    }

    this.corners = bounds.getCorner()
    this.scale(scale)
  }

  public getType() {
    return this._type
  }

  public getAbsoluteOrigin(pct: Primitive.PointData, bounds: Primitive.Rectangle) {
    return {
      x: bounds.x + bounds.width * pct.x,
      y: bounds.y + bounds.height * pct.y,
    }
  }

  public scale(point: Primitive.PointData) {
    this.setScale(point)

    Primitive.Polygon.scale(this.math.points, point, this.originScale)
    Primitive.Polygon.scale(this.corners, point, this.originScale)

    const offset = Point.subtract(this.originRotate, this.originScale)
    const transformed = Point.multiple(offset, point) 
    const next = Point.add(this.originScale, transformed)

    this.originRotate.copyFrom(next)
  }

  public rotate(angle: number): void {
    this.setAngle(angle)

    Primitive.Polygon.rotate(this.math.points, angle, this.originRotate)
    Primitive.Polygon.rotate(this.corners, angle, this.originRotate)

    const offset = Point.subtract(this.originScale, this.originRotate)
    const transformed = Point.rotate(offset, angle)
    const next = Point.add(transformed, this.originRotate)

    this.originScale.copyFrom(next)
  }

  public contains(point: Primitive.PointData): boolean {
    return this.math.contains(point.x, point.y)
  }

  public getClientRect(): Primitive.Rectangle {
    const scale = this.getScale()
    const position = this.getPosition()

    this.math.getBounds(this._bounds)

    this._bounds.x = this._bounds.x * scale.x + position.x
    this._bounds.y = this._bounds.y * scale.y + position.y
    this._bounds.width *= scale.x
    this._bounds.height *= scale.y

    return this._bounds
  }

  public drawScaleOrigin(context: CanvasRenderingContext2D): void {
    const position = this.originScale

    context.save()
    context.font = "14px Arial"
    context.textAlign = "center"
    context.textBaseline = "bottom"
    context.fillText("scale", position.x, position.y - 5)
    context.fillStyle = "red"
    context.beginPath()
    context.arc(position.x, position.y, 5, 0, Math.PI * 2)
    context.closePath()
    context.fill()
    context.restore()
  }

  public drawRotateOrigin(context: CanvasRenderingContext2D): void {
    const position = this.originRotate

    context.save()
    context.font = "14px Arial"
    context.textAlign = "center"
    context.textBaseline = "bottom"
    context.fillText("rotate", position.x, position.y - 5)
    context.fillStyle = "blue"
    context.beginPath()
    context.arc(position.x, position.y, 5, 0, Math.PI * 2)
    context.closePath()
    context.fill()
    context.restore()
  }

  public drawCorners(context: CanvasRenderingContext2D) {
    context.save()
    context.beginPath()
    this.corners.forEach((point) => context.lineTo(point.x, point.y))
    context.closePath()
    context.stroke()
    context.restore()
  }

  public draw(context: CanvasRenderingContext2D): void {
    const position = this.getPosition()

    context.save()
    context.translate(position.x, position.y)

    context.fillStyle = "darkorange"
    context.beginPath()
    this.math.points.forEach((point) => context.lineTo(point.x, point.y))
    context.closePath()
    context.stroke()
    context.fill()

    context.restore()

    this.drawCorners(context)
    this.drawScaleOrigin(context)
    this.drawRotateOrigin(context)
  }
}