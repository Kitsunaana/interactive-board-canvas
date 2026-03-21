import * as Primitive from "./maths";
import { Node } from "./Node";

export abstract class Container extends Node {
  public abstract absolutePositionCursor: Primitive.PointData

  public abstract draw(context: CanvasRenderingContext2D): void
  public abstract getType(): string

  private _children: Array<Node> = []

  private readonly _localBounds: Primitive.Rectangle = new Primitive.Rectangle()
  private readonly _clientRect: Primitive.Rectangle = new Primitive.Rectangle()

  public contains(point: Primitive.PointData): boolean {
    this.getClientRect()

    return this._localBounds.contains(point.x, point.y)
  }

  public getCorners() {
    return this._children.flatMap((child) => (
      child
        .getClientRect()
        .getCorner()
    ))
  }

  public getClientRect(): Primitive.Rectangle {
    const corners = this.getCorners()

    new Primitive.Polygon(corners).getBounds(this._localBounds)

    const position = this.position()
    const scale = this.scale()

    this._clientRect.x = this._localBounds.x * scale.x + position.x
    this._clientRect.y = this._localBounds.y * scale.y + position.y
    this._clientRect.width = this._localBounds.width * scale.x
    this._clientRect.height = this._localBounds.height * scale.y

    return this._clientRect
  }

  public getChildren() {
    return this._children
  }
}