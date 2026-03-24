import * as Primitive from "./maths";
import { Node, type NodeConfig } from "./Node";

interface GroupConfig extends NodeConfig {
}

export class Group extends Node {
  protected readonly _type = "Group"

  private _children: Array<Node> = []

  private readonly _localBounds: Primitive.Rectangle = new Primitive.Rectangle()
  private readonly _clientRect: Primitive.Rectangle = new Primitive.Rectangle()

  private readonly _absolutePositionCursor: Primitive.PointData = {
    x: 0,
    y: 0,
  }

  public get absolutePositionCursor() {
    return this.getParent()?.absolutePositionCursor ?? this._absolutePositionCursor
  }

  public getType() {
    return this._type
  }

  public contains(point: Primitive.PointData): boolean {
    this.getClientRect()

    return this._localBounds.contains(point.x, point.y)
  }

  public getClientRect(): Primitive.Rectangle {
    const corners = this._children.flatMap((child) => (
      child
        .getClientRect()
        .getCorner()
    ))

    new Primitive.Polygon(corners).getBounds(this._localBounds)

    return this._localBounds
  }

  public add(...children: Array<Node>) {
    children.forEach((child) => {
      this._children.push(child)

      child.setParent(this)
    })
  }

  public getChildren() {
    return this._children
  }

  public draw(context: CanvasRenderingContext2D): void {
    // this.__debugDrawBounds(context)

    const position = this.getPosition()
    const scale = this.getScale()

    context.save()

    context.translate(position.x, position.y)
    // context.scale(scale.x, scale.y)

    this._children.forEach((child) => child.draw(context))

    context.restore()
  }

  private __debugDrawBounds(context: CanvasRenderingContext2D) {
    const bounds = this.getClientRect()

    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }
}