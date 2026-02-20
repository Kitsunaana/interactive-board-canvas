import { Node } from "./Node";
import type { Observerable } from "./shared/Observer";
import * as Maths from "./maths"
import { isUndefined } from "lodash";

interface GroupConfig {
  x: number
  y: number

  name?: string
}

export class Group extends Node implements Observerable {
  private readonly _type = "Group" as const

  private _children: Array<Node> = []
  private _needUpdateClientRect: boolean = true

  private readonly _clientRect: Maths.Rectangle = new Maths.Rectangle()

  public readonly absolutePositionCursor: Maths.PointData = {
    x: 0,
    y: 0,
  }

  public constructor(config?: GroupConfig) {
    super()

    this.init(this)
    this.attach(this)

    if (!isUndefined(config)) {
      this._position.x = config.x
      this._position.y = config.y
      this._name = config.name
    }
  }

  public update(): void {
    this._needUpdateClientRect = true
  }

  public getType() {
    return this._type
  }

  public draw(context: CanvasRenderingContext2D): void {
    this.__debugDrawBounds(context)

    context.save()

    context.translate(this._position.x, this._position.y)
    this._children.forEach((child) => child.draw(context))

    context.restore()
  }

  public contains(point: Maths.PointData): boolean {
    return this._clientRect.contains(point.x, point.y)
  }

  public getRelativePointerPosition() {
    const absolutePosition = this.getAbsolutePosition()

    return {
      x: this.absolutePositionCursor.x - absolutePosition.x,
      y: this.absolutePositionCursor.y - absolutePosition.y,
    }
  }

  public getClientRect(): Maths.Rectangle {
    if (this._needUpdateClientRect) {
      this._needUpdateClientRect = false

      const corners = this._children.flatMap((child) => (
        child
          .getClientRect()
          .getCorner()
      ))

      new Maths.Polygon(corners).getBounds(this._clientRect)

      this._clientRect.x += this._position.x
      this._clientRect.y += this._position.y
    }

    return this._clientRect
  }

  public add(...children: Array<Node>) {
    children.forEach((child) => {
      this._children.push(child)

      child._parent = this
    })
  }

  private __debugDrawBounds(context: CanvasRenderingContext2D) {
    const bounds = this.getClientRect()

    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }
}