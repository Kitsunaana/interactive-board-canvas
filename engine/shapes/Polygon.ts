import { Node, type NodeConfig } from "../Node"
import * as Primitive from "../maths"

export interface PolygonConfig extends NodeConfig {
  points: Primitive.PointData[],
}

export class Polygon extends Node {
  private readonly _type = "Shape" as const

  public readonly initialCenter: Primitive.Point = new Primitive.Point()
  public readonly math: Primitive.Polygon

  private readonly _matrix: Primitive.Matrix = new Primitive.Matrix()
  private readonly _bounds: Primitive.Rectangle = new Primitive.Rectangle()

  public get absolutePositionCursor() {
    return this.parent()!.absolutePositionCursor
  }

  public constructor(config: PolygonConfig) {
    super(config)

    this.math = new Primitive.Polygon(config.points)
    
    const initialBounds = this.math.getBounds()
    this.initialCenter.set(initialBounds.centerX, initialBounds.centerY)
  }

  public getType() {
    return this._type
  }

  public rotate(angle: number): void {
    super.rotate(angle)

    this._matrix
      .clear()
      .setPivot(this.initialCenter.x, this.initialCenter.y)
      .rotate(angle)

    this.math.applyMatrix(this._matrix)
  }

  public contains(point: Primitive.PointData): boolean {
    return this.math.contains(point.x, point.y)
  }

  public getClientRect(): Primitive.Rectangle {
    const scale = this.scale()
    const position = this.position()

    this.math.getBounds(this._bounds)

    this._bounds.x = this._bounds.x * scale.x + position.x
    this._bounds.y = this._bounds.y * scale.y + position.y
    this._bounds.width *= scale.x
    this._bounds.height *= scale.y

    return this._bounds
  }

  public draw(context: CanvasRenderingContext2D): void {
    context.save()
    context.translate(this.position().x, this.position().y)
    context.scale(this.scale().x, this.scale().y)

    context.fillStyle = "darkorange"
    context.beginPath()
    this.math.points.forEach((point) => context.lineTo(point.x, point.y))
    context.closePath()
    context.stroke()
    context.fill()

    context.restore()
  }
}