import * as Primitive from "./maths";
import { Node, type NodeConfig } from "./Node";
import type { Observable } from "./shared/Observer";

interface GroupConfig extends NodeConfig {
}

export class Group extends Node implements Observable {
  private readonly _type = "Group" as const

  private _children: Array<Node> = []

  private readonly _localBounds: Primitive.Rectangle = new Primitive.Rectangle()
  private readonly _clientRect: Primitive.Rectangle = new Primitive.Rectangle()

  public readonly absolutePositionCursor: Primitive.PointData = {
    x: 0,
    y: 0,
  }

  public update(): void {
    this._needUpdate = true
  }

  public getType() {
    return this._type
  }

  public contains(point: Primitive.PointData): boolean {
    this.getClientRect()

    return this._localBounds.contains(point.x, point.y)
  }

  public getClientRect(): Primitive.Rectangle {
    if (this._needUpdate) {
      this._needUpdate = false

      const corners = this._children.flatMap((child) => (
        child
          .getClientRect()
          .getCorner()
      ))

      new Primitive.Polygon(corners).getBounds(this._localBounds)

      const position = this.position()
      const scale = this.scale()

      this._clientRect.x = this._localBounds.x * scale.x + position.x
      this._clientRect.y = this._localBounds.y * scale.y + position.y
      this._clientRect.width = this._localBounds.width * scale.x
      this._clientRect.height = this._localBounds.height * scale.y
    }

    return this._clientRect
  }

  public add(...children: Array<Node>) {
    children.forEach((child) => {
      this._children.push(child)

      child.parent(this)
    })
  }

  public getChildren() {
    return this._children
  }

  public draw(context: CanvasRenderingContext2D): void {
    this.__debugDrawBounds(context)

    context.save()

    context.translate(this.position().x, this.position().y)
    context.scale(this.scale().x, this.scale().y)

    this._children.forEach((child) => child.draw(context))

    context.restore()
  }

  private __debugDrawBounds(context: CanvasRenderingContext2D) {
    const bounds = this.getClientRect()

    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }
}