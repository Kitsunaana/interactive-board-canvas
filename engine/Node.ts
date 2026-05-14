import { isNull } from "lodash"
import { nanoid } from "nanoid"
import * as Primitive from "./maths"
import { Mixin } from "ts-mixer"
import { EventBehavior } from "./behaviors/EventBehavior"
import { Transformable } from "./behaviors/Transformable"

export interface NodeConfig {
  isDraggable?: boolean
  scaleX?: number
  scaleY?: number
  name?: string
  x?: number
  y?: number
}

export const fillConfigDefaultValues = (config: NodeConfig) => ({
  isDraggable: true,
  name: undefined,
  scaleX: 1,
  scaleY: 1,
  x: 0,
  y: 0,
  ...config,
})

export abstract class Node extends Mixin(EventBehavior, Transformable) {
  public abstract render(context: CanvasRenderingContext2D): void
  public abstract renderHit(context: CanvasRenderingContext2D): void
  public abstract getBounds(): Primitive.Rectangle

  private readonly _id = nanoid()

  protected readonly abstract _type: string
  protected _name: string | undefined = undefined

  private _parent: Node | null = null

  public get id(): string {
    return this._id
  }

  public constructor(params: NodeConfig) {
    super()

    const config = fillConfigDefaultValues(params)
    this._name = config.name
  }

  public getType(): string {
    return this._type
  }

  public getName() {
    return this._name
  }

  public setParent(node: Node) {
    this._parent = node
  }

  public getParent() {
    return this._parent
  }

  public getAllParents<T extends Node>(list: Array<T> = []): Array<T> {
    const parent = this.getParent() as unknown as T

    return isNull(parent)
      ? list
      : this.getAllParents.call(parent, list.concat(parent)) as Array<T>
  }

  public findAncestor<T extends Node>(predicate: (node: Node) => boolean): T | null {
    let current = this.getParent()

    while (current) {
      if (predicate(current)) return current as T
      current = current.getParent()
    }

    return null
  }
}
