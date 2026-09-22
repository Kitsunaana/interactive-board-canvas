import { isNull, isUndefined } from "lodash";
import { nanoid } from "nanoid";
import { Mixin } from "ts-mixer";
import { DragBehavior } from "../behaviors/drag-behavior";
import { EventBehavior } from "../behaviors/EventBehavior";
import { Transformable } from "../behaviors/Transformable";
import { createRoute, EventEmitter } from "../EventBus";
import { Group } from "../Group";
import type { Layer } from "../LayerV2";
import { Matrix3x3, Point, type PointData, type Rectangle } from "../maths";
import type { Stage } from "../Stage";

export type GetBoundsParams = {
  skipTransform?: boolean
}

export type GetPointsParams = {
  applyTransform?: boolean
  applyCachedTransform?: boolean
}

const ERROR_MESSAGES = {
  WITHOUT_PARENT_FOR_GET_LAYER: "The SimObject has not been added to any Group or Layer",
  NOT_FOUND_LAYER: "SimObject not added to the layer",

  WITHOUT_PARENT_FOR_GET_STAGE: "SimObject Layer not added to the Stage",
  NOT_FOUND_STAGE: "SimObject Layer not added to the Stage",
}

export abstract class SimObject extends Mixin(Transformable, EventBehavior) {
  public abstract getPoints(params?: GetPointsParams): Array<PointData>
  public abstract getBounds(params?: GetBoundsParams): Rectangle
  public abstract getUnrotateBounds(): Rectangle
  public abstract updateAfterTransform(): void

  _translate = Point.zero()

  protected _children: Array<SimObject> = []

  public readonly type: string = "SimObject"

  public classList: Array<string> = []
  public id: string = nanoid()

  public __testMatrix: Matrix3x3 = Matrix3x3.identity()
  public cachedMatrix: Matrix3x3 = Matrix3x3.identity()
  public worldMatrix: Matrix3x3 = Matrix3x3.identity()
  public localMatrix: Matrix3x3 = Matrix3x3.identity()

  private _parent: SimObject | null = null

  public isListening: boolean = true
  public visible: boolean = true

  public dragBehavior: DragBehavior = new DragBehavior(this)

  public emitter = new EventEmitter()
  public routes = {
    ...this.dragBehavior.routes,
    addChild: createRoute("addChild").withParams<{ child: SimObject }>(),
    addToParent: createRoute("addToParent"),
  }

  // @ts-ignore
  public set parent(node: SimObject | null) {
    this._parent = node
    this.emitter.emit(this.routes.addToParent())
  }

  public get parent() {
    return this._parent
  }

  public get layer() {
    return this._getFirstParentByType<Layer>({
      withoutParent: ERROR_MESSAGES.WITHOUT_PARENT_FOR_GET_LAYER,
      notFoundObject: ERROR_MESSAGES.NOT_FOUND_LAYER,
      type: "Layer",
    })
  }

  public get stage() {
    return this._getFirstParentByType<Stage>({
      withoutParent: ERROR_MESSAGES.WITHOUT_PARENT_FOR_GET_STAGE,
      notFoundObject: ERROR_MESSAGES.NOT_FOUND_STAGE,
      type: "Stage",
    })
  }

  public applyDeltaTransform(deltaMatrix: Matrix3x3): void {
    if (this.isInteracting) this.cachedMatrix = deltaMatrix
    else this.localMatrix = Matrix3x3.multiply(deltaMatrix, this.localMatrix)

    this.updateWorldTransform()
  }

  public updateWorldTransform(): void {
    const parent = this.parent
    const children = this.children

    if (parent) this.worldMatrix = Matrix3x3.multiply(parent.worldMatrix, this.localMatrix)
    else this.worldMatrix = this.localMatrix.clone()

    this.worldMatrix = Matrix3x3.compose(this.worldMatrix, this.__testMatrix)

    this.updateAfterTransform()
    children.forEach((child) => child.updateWorldTransform())
  }

  public addName(name: string): void {
    if (this.includeName(name)) return
    this.classList.push(name)
  }

  public includeName(name: string): boolean {
    return this.classList.includes(name)
  }

  public get children(): Array<SimObject> {
    return this._children
  }

  public appendChild(...list: Array<SimObject>) {
    list.forEach((child) => {
      this._children.push(child)
      this.emitter.emit(this.routes.addChild({ child }))

      child.parent = this
    })
  }

  public getCornersWithAppliedMatrix(): Array<PointData> {
    const bounds = this.getBounds({ skipTransform: true })
    const matrix = this.worldMatrix

    return bounds
      .getCorners()
      .map(matrix.applyToPoint.bind(matrix))
  }

  public findObjectsByName(name: string) {
    return this
      .getFlatListChildren()
      .filter((child) => child.includeName(name))
  }

  public getFlatListChildren(): Array<SimObject> {
    return this.children.flatMap((child) => (
      Group.isGroup(child)
        ? this.getFlatListChildren.call(child)
        : child
    ))
  }

  public getAllParents<T extends SimObject>(list: Array<T> = []): Array<T> {
    const parent = this.parent as unknown as T

    return isNull(parent)
      ? list
      : this.getAllParents.call(parent, list.concat(parent)) as Array<T>
  }

  public render(context: CanvasRenderingContext2D): void {
    this.children.forEach((child) => child.render(context))
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    this.children.forEach((child) => child.renderHit(context))
  }

  protected _getFirstParentByType<T>({ type, notFoundObject, withoutParent }: {
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
