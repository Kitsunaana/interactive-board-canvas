import { isUndefined } from "lodash";
import * as Primitive from "./maths";
import { Node } from "./Node";

export abstract class Container<Child extends Node> extends Node {
  public abstract absolutePositionCursor: Primitive.PointData

  public abstract draw(context: CanvasRenderingContext2D): void
  public abstract getType(): string

  protected _children: Array<Child> = []

  protected readonly _localBounds: Primitive.Rectangle = new Primitive.Rectangle()
  protected readonly _clientRect: Primitive.Rectangle = new Primitive.Rectangle()

  public contains(x: number, y: number): boolean {
    this.getClientRect()

    return this._localBounds.contains(x, y)
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

    const position = this.getPosition()
    const scale = this.getScale()

    this._clientRect.x = this._localBounds.x * scale.x + position.x
    this._clientRect.y = this._localBounds.y * scale.y + position.y
    this._clientRect.width = this._localBounds.width * scale.x
    this._clientRect.height = this._localBounds.height * scale.y

    return this._clientRect
  }

  public getChildren() {
    return this._children
  }

  public getAllChildren() {
    const result: Child[] = [];
    const stack = [...this.getChildren()];

    while (stack.length) {
      const node = stack.pop()
      if (isUndefined(node)) break

      result.push(node)

      if (node instanceof Container && node.getChildren().length) {
        stack.push(...node.getChildren())
      }
    }

    return result
  }
}