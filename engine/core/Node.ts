import { isNull, isUndefined } from "lodash"
import { nanoid } from "nanoid"
import { DRAG_ROUTES } from "../behaviors/drag-behavior"
import { EventBehavior } from "../behaviors/EventBehavior"
import { createRoute, EventEmitter } from "../EventBus"
import { type PointData, Rectangle } from "../maths"
import type { Container } from "./Container"
import type { Layer } from "./Layer"
import type { Stage } from "./Stage"
import type { SimObject } from "./SimObject";

export const routes = {
  ...DRAG_ROUTES,
  addChild: createRoute("addChild").withParams<{ child: SimObject }>(),
  addToParent: createRoute("addToParent").withParams<{ parent: Container }>(),
  removeChild: createRoute("removeChild").withParams<{ child: SimObject }>(),
  destroy: createRoute("destroy"),
  remove: createRoute("remove"),
}

class CustomEvents extends EventEmitter {
  public dispose(): void {
    this._listeners.clear()
  }
}

export type NodeConfig = {
  names?: Array<string>
  zIndex?: number
}

export type GetBoundsParams = {
  skipTransform?: boolean
}

export type GetPointsParams = {
  applyTransform?: boolean
}


export abstract class Node extends EventBehavior {
  public abstract render(context: CanvasRenderingContext2D): void
  public abstract renderHit(context: CanvasRenderingContext2D): void
  public abstract getPoints(params?: GetPointsParams): Array<PointData>
  public abstract getBounds(params?: GetBoundsParams): Rectangle
  public abstract getUnrotateBounds(): Rectangle
  public abstract updateAfterTransform(): void
  public abstract clone(): SimObject

  public abstract layer: Layer
  public abstract stage: Stage

  public readonly id: string = nanoid()
  public readonly type: string = "SimObject"

  public isVisible: boolean = true
  public isListening: boolean = true

  public readonly emitter: CustomEvents = new CustomEvents()

  private _dataAttributeMap: Map<string, unknown> = new Map()
  private _parent: Container | null = null
  private _nameList: Array<string> = []

  protected _unrotateBounds: Rectangle = new Rectangle(0, 0, 0, 0)
  protected _initialBounds: Rectangle = new Rectangle(0, 0, 0, 0)
  protected _bounds: Rectangle = new Rectangle(0, 0, 0, 0)

  public names?: Array<string> = []
  public zIndex: number = 1

  public set parent(parent: Container | null) {
    this._parent = parent
  }

  public get parent(): Container | null {
    return this._parent
  }

  public get bounds(): Rectangle {
    return this._bounds
  }

  public get unrotateBounds(): Rectangle {
    return this._unrotateBounds
  }

  public get initialBounds(): Rectangle {
    return this._initialBounds
  }

  public constructor(config: NodeConfig = {}) {
    super()

    if (config.names) config.names.forEach((name) => this.addName(name))
    if (config.zIndex) this.zIndex = config.zIndex
  }

  private updateBounds() {
    this._bounds = this.getBounds()
    this._unrotateBounds = this.getUnrotateBounds()
    this._initialBounds = this.getBounds({
      skipTransform: true
    })
  }

  public updateBoundsUp() {
    let current: Node | null = this
    while (current) {
      current.updateBounds()
      current = current.parent as Node | null
    }
  }

  public addName(name: string): void {
    if (this.hasName(name)) return
    this._nameList.push(name)
  }

  public hasName(name: string): boolean {
    return this._nameList.includes(name)
  }

  public removeName(name: string): void {
    const index = this._nameList.indexOf(name)
    if (index === -1) return
    this._nameList.splice(index, 1)
  }

  public setDataAttr(key: string, value: unknown): void {
    this._dataAttributeMap.set(key, value)
  }

  public getDataAttr<T extends unknown>(key: string): T {
    return this._dataAttributeMap.get(key) as T
  }

  public removeDataAttr(key: string): void {
    this._dataAttributeMap.delete(key)
  }

  public hasDataAttr(key: string): boolean {
    return this._dataAttributeMap.has(key)
  }

  public clearDataAttrs() {
    this._dataAttributeMap.clear()
  }

  public getAllParents<T extends Container>(list: Array<T> = []): Array<T> {
    const parent = this.parent as unknown as T

    return isNull(parent)
      ? list
      : this.getAllParents.call(parent, list.concat(parent)) as Array<T>
  }

  public getFirstParentByType<T>({ type, notFoundObject, withoutParent }: {
    notFoundObject?: string
    withoutParent?: string
    type: string
  }): T {
    const parents = this.getAllParents()
    if (parents.length === 0) throw new Error(withoutParent)

    const object = parents.find((parent) => parent.type === type)
    if (isUndefined(object)) throw new Error(notFoundObject)

    return object as unknown as T
  }

  public setAttribute<T extends this, K extends keyof SafeParams<this>>(key: K, value: T[K]): void {
    switch (key) {
      case "names": {
        const list = value as Node["names"]
        if (list) list.forEach((name) => this.addName(name))
        break
      }

      case "parent":
      case "stage":
      case "layer":
      case "isVisible":
      case "isListening": {
        this[key] = value
        break
      }

      case "id":
      case "type":
      case "bounds":
      case "emitter":
      case "initialBounds":
      case "unrotateBounds":
        break
    }
  }

  public getAttribute<T extends this, K extends keyof SafeParams<T>>(key: K) {
    return this[key]
  }
}

export type SafeParams<T> = {
  [K in keyof T as T[K] extends ((...args: any[]) => any) ? never : K]: T[K]
}
