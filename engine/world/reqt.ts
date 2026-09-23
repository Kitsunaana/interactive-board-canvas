import { isNull, isUndefined } from "lodash"
import { nanoid } from "nanoid"
import { DragBehavior } from "../behaviors/drag-behavior"
import { EventBehavior } from "../behaviors/EventBehavior_v2"
import { Transformer } from "../behaviors/TransformerV4"
import { createRoute, EventEmitter } from "../EventBus"
import type { Layer } from "../LayerV2"
import { Matrix3x3, Point, type PointData, Rectangle } from "../maths"
import type { Stage } from "../Stage"
import type { GetBoundsParams } from "./sim-object"
import { GradientData } from "./GradientData"

interface NodeToCustomEventsImpl {
  parent: NodeToCustomEventsImpl | null
  system_events: EventBehavior
}

class CustomEvents extends EventEmitter {
  public routes = {
    addChild: createRoute("addChild").withParams<{ child: Node }>(),
    addToParent: createRoute("addToParent").withParams<{ parent: Container }>(),
    removeChild: createRoute("removeChild").withParams<{ child: Node }>(),
    destroy: createRoute("destroy"),
    remove: createRoute("remove"),
  }

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

export abstract class Node {
  public abstract render(context: CanvasRenderingContext2D): void
  public abstract renderHit(context: CanvasRenderingContext2D): void
  public abstract getBounds(params: GetBoundsParams): Rectangle
  public abstract updateAfterTransform(): void

  private _dataAttributeMap: Map<string, unknown> = new Map()
  private _parent: Container | null = null
  private _nameList: Array<string> = []

  public readonly id: string = nanoid()
  public readonly type: string = "Node"

  public readonly transform: Transformer = new Transformer(this)
  public readonly draggable: DragBehavior = new DragBehavior(this)
  public readonly system_events: EventBehavior = new EventBehavior(this)
  public readonly custom_events: CustomEvents = new CustomEvents(this)

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
    if (this.transform.isInteracting) this.transform.cachedMatrix = deltaMatrix
    else this.transform.localMatrix = Matrix3x3.multiply(deltaMatrix, this.transform.localMatrix)

    this.updateWorldTransform()
  }

  public updateWorldTransform(): void {
    const parent = this.parent

    if (parent) this.transform.worldMatrix = Matrix3x3.multiply(parent.transform.worldMatrix, this.transform.localMatrix)
    else this.transform.worldMatrix = this.transform.localMatrix.clone()

    this.transform.worldMatrix = Matrix3x3.compose(this.transform.worldMatrix, this.transform.__testMatrix)

    this.updateAfterTransform()
  }

  public remove() {
    this.parentOrThrow.removeChild(this)
    this.custom_events.emit(this.custom_events.routes.remove())
    return this
  }

  public destroy() {
    this.remove()
    this.system_events.off()
    this.custom_events.dispose()
    this.custom_events.emit(this.custom_events.routes.destroy())
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
    if (parents.length === 0) {
      debugger
      throw new Error(withoutParent)
    }

    const object = parents.find((parent) => parent.type === type)
    if (isUndefined(object)) throw new Error(notFoundObject)

    return object as unknown as T
  }
}

export abstract class Container extends Node {
  private _children: Array<Node> = []

  public get children() {
    return this._children
  }

  public render(context: CanvasRenderingContext2D): void {
    this.children.forEach((child) => child.render(context))
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    this.children.forEach((child) => child.renderHit(context))
  }

  public updateWorldTransform(): void {
    super.updateWorldTransform()
    this.children.forEach(this.updateWorldTransform.call)
  }

  public destroy() {
    super.destroy()
    this.children.forEach(this.destroy.call)
  }

  public removeChild(child: Node) {
    const index = this._children.indexOf(child)
    if (index === -1) throw new Error("child not found")
    child.parent = null

    this._children.splice(index, 1)
    this.custom_events.emit(this.custom_events.routes.removeChild({ child }))
  }

  public appendChild(...list: Array<Node>) {
    list.forEach((child) => {
      this._children.push(child)
      this.custom_events.emit(this.custom_events.routes.addChild({ child }))

      child.parent = this
      child.custom_events.emit(child.custom_events.routes.addToParent({ parent: this }))
    })
  }
}

export type ShapeConfig = NodeConfig & {
  strokeStyle?: string
  fillStyle?: string
  lineWidth?: number
}

const fillShapeConfigDefaulValues = (config: ShapeConfig): Required<ShapeConfig> => {
  return {
    strokeStyle: "black",
    fillStyle: "skyblue",
    lineWidth: 1,
    names: [],

    ...config,
  }
}



export abstract class Shape extends Node {
  public strokeStyle: string = "black"
  public fillStyle: string = "skyblue"
  public lineWidth: number = 1

  public gradient: GradientData | null = null

  public constructor({ names, ...params }: ShapeConfig) {
    super({ names })

    const config = fillShapeConfigDefaulValues(params)
    Object.assign(this, config)
  }

  protected fillStrokeShape(context: CanvasRenderingContext2D) {
    context.lineWidth = this.lineWidth
    context.fillStyle = this.fillStyle
    context.strokeStyle = this.strokeStyle

    context.fill()
    context.stroke()

    this.gradient?.applyToContext(context, this)
  }

  protected fillStrokeHitShape(context: CanvasRenderingContext2D) {
    const color = this.layer.getHitColor(this)

    context.fillStyle = color
    context.strokeStyle = color
    context.lineWidth = this.lineWidth
    context.fill()
    context.stroke()
  }
}
