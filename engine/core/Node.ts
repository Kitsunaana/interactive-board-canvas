import { isNull, isUndefined } from "lodash"
import { EventBehaviorV2 } from "../behaviors/EventBehavior_v2"
import { createRoute, EventEmitter } from "../EventBus"
import { Matrix3x3, Point, type PointData, Rectangle } from "../maths"
import { nanoid } from "nanoid"
import { DragBehavior } from "../behaviors/drag-behavior"
import { Transformer } from "../behaviors/TransformerV4"
import type { Layer } from "./Layer"
import type { Stage } from "./Stage"
import type { Container } from "./Container"

interface NodeToCustomEventsImpl {
}

export const routes = {
  addChild: createRoute("addChild").withParams<{ child: Node }>(),
  addToParent: createRoute("addToParent").withParams<{ parent: Container }>(),
  removeChild: createRoute("removeChild").withParams<{ child: Node }>(),
  destroy: createRoute("destroy"),
  remove: createRoute("remove"),
}

class CustomEvents extends EventEmitter {
  public constructor(private readonly node: NodeToCustomEventsImpl) {
    super()
  }

  public dispose(): void {
    this._listeners.clear()
  }
}

export type NodeConfig = {
  names?: Array<string>
}

export type GetBoundsParams = {
  skipTransform?: boolean
}

export type GetPointsParams = {
  applyTransform?: boolean
  applyCachedTransform?: boolean
}

export abstract class Node {
  public abstract render(context: CanvasRenderingContext2D): void
  public abstract renderHit(context: CanvasRenderingContext2D): void
  public abstract getPoints(params?: GetPointsParams): Array<PointData>
  public abstract getBounds(params: GetBoundsParams): Rectangle
  public abstract updateAfterTransform(): void

  private _dataAttributeMap: Map<string, unknown> = new Map()
  private _parent: Container | null = null
  private _nameList: Array<string> = []

  public readonly id: string = nanoid()
  public readonly type: string = "Node"

  public readonly transform: Transformer = new Transformer(this)
  public readonly draggable: DragBehavior = new DragBehavior(this)
  public readonly events: EventBehaviorV2 = new EventBehaviorV2(this)
  public readonly emitter: CustomEvents = new CustomEvents(this)

  public set parent(parent: Container | null) {
    this._parent = parent
  }

  public get parent(): Container | null {
    return this._parent
  }

  public get parentOrThrow(): Container {
    if (isNull(this._parent)) throw new Error("Parent is not defined")
    return this._parent
  }

  public get layer() {
    return this.getFirstParentByType<Layer>({ type: "Layer" })
  }

  public get stage() {
    return this.getFirstParentByType<Stage>({ type: "Stage" })
  }

  public get x() {
    return this.position.x
  }

  public get y() {
    return this.position.y
  }

  public get position(): Point {
    return this.getBounds({}).point()
  }

  public set position(nextPos: PointData) {
    this.transform.translate(Point.fromData(nextPos).sub(this.position))
  }

  public get worldMatrix() {
    return this.transform.worldMatrix
  }

  public get localMatrix() {
    return this.transform.localMatrix
  }

  public get cachedMatrix() {
    return this.transform.cachedMatrix
  }

  public set worldMatrix(matrix: Matrix3x3) {
    this.transform.worldMatrix = matrix
  }

  public set localMatrix(matrix: Matrix3x3) {
    this.transform.localMatrix = matrix
  }

  public set cachedMatrix(matrix: Matrix3x3) {
    this.transform.cachedMatrix = matrix
  }

  public get isInteracting() {
    return this.transform.isInteracting
  }

  public set isInteracting(value: boolean) {
    this.transform.isInteracting = value
  }

  public constructor(config: NodeConfig = {}) {
    this.draggable.subscribe()

    if (config.names) config.names.forEach((name) => this.addName(name))
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

  public applyDeltaTransform(deltaMatrix: Matrix3x3): void {
    if (this.isInteracting) this.cachedMatrix = deltaMatrix
    else this.localMatrix = Matrix3x3.multiply(deltaMatrix, this.localMatrix)

    this.updateWorldTransform()
  }

  public updateWorldTransform(): void {
    const parent = this.parent

    if (parent) this.worldMatrix = Matrix3x3.multiply(parent.worldMatrix, this.localMatrix)
    else this.worldMatrix = this.localMatrix.clone()

    this.worldMatrix = Matrix3x3.compose(this.worldMatrix, this.transform.__testMatrix)

    this.updateAfterTransform()
  }

  public remove() {
    this.parentOrThrow.removeChild(this)
    this.emitter.emit(routes.remove())
    return this
  }

  public destroy() {
    this.remove()
    this.events.off()
    this.emitter.emit(routes.destroy())
    this.emitter.dispose()
    this.draggable.unsubscribe()
  }

  public moveTo(parent: Container) {
    parent.appendChild(this.remove())
  }

  public getAllParents<T extends Node>(list: Array<T> = []): Array<T> {
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
}