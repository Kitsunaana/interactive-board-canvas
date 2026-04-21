import { isUndefined } from "lodash";
import * as Primitive from "./maths";
import { Node } from "./Node";

export abstract class Container<Child extends Node> extends Node {
  public abstract draw(context: CanvasRenderingContext2D): void

  protected readonly _localBounds: Primitive.Rectangle = new Primitive.Rectangle()

  protected _children: Array<Child> = []

  public getChildren() {
    return this._children
  }

  public contains(x: number, y: number): boolean {
    return this.getClientRect().contains(x, y)
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
    return this._localBounds
  }

  public getAllFlatChildren(): Array<Child> {
    const result: Array<Child> = [];
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