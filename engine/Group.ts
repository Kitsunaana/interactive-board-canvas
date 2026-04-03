import * as Primitive from "./maths";
import { Node, type NodeConfig } from "./Node";

interface GroupConfig extends NodeConfig {
}

export class Group extends Node {
  protected readonly _type = "Group"

  private _children: Array<Node> = []

  private readonly _localBounds: Primitive.Rectangle = new Primitive.Rectangle()

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

  public contains(x: number, y: number): boolean {
    this.getClientRect()

    return this._localBounds.contains(x, y)
  }

  public getPoints(): Array<Primitive.PointData> {
    return this.getChildren().flatMap((child) => {
      return child.getPoints()
    })
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
    const position = this.getPosition()

    context.save()
    context.translate(position.x, position.y)
    this._children.forEach((child) => child.draw(context))
    context.restore()
  }
}