import { defaultTo, isEmpty, isNull, isUndefined } from "lodash";
import { nanoid } from "nanoid";
import { Mixin } from "ts-mixer";
import { Draggable } from "../behaviors/Draggable";
import { EventBehavior } from "../behaviors/EventBehavior";
import { Transformable } from "../behaviors/Transformable";
import { Group } from "../Group";
import type { LayerV2 as Layer } from "../LayerV2";
import { Matrix3x3, Point, type PointData, type Rectangle } from "../maths";
import type { Sizes } from "../Stage";
import { createRoute, EventEmitter } from "../EventBus"

export type GetBoundsParams = {
  skipTransform?: boolean
}

export type CacheConfig = {
  x?: number
  y?: number
  width?: number
  height?: number
  offset?: number
  drawBorder?: boolean
  imageSmoothingEnabled?: boolean
}

export type GetPointsParams = {
  applyTransform?: boolean
  applyCachedTransform?: boolean
}

export abstract class SimObject extends Mixin(Transformable, Draggable, EventBehavior) {
  public abstract getBounds(params?: GetBoundsParams): Rectangle
  public abstract getUnrotateBounds(): Rectangle
  public abstract updateAfterTransform(): void
  public abstract getPoints(params?: GetPointsParams): Array<PointData>

  public classList: Array<string> = []
  public id: string = nanoid()

  public isCached: boolean = false
  public isCacheDirty: boolean = true

  public __testMatrix: Matrix3x3 = Matrix3x3.identity()

  public cachedMatrix: Matrix3x3 = Matrix3x3.identity()
  public worldMatrix: Matrix3x3 = Matrix3x3.identity()
  public localMatrix: Matrix3x3 = Matrix3x3.identity()

  public visible: boolean = true

  protected _children: Array<SimObject> = []
  protected _parent: SimObject | null = null
  protected _layer: Layer | null = null

  public isListening: boolean = true

  public eventBus = new EventEmitter()
  public eventRoutes = {
    changePosition: createRoute("changePosition"),
    finishDrag: createRoute("finishDrag"),
  }

  public applyDeltaTransform(deltaMatrix: Matrix3x3): void {
    if (this.isInteracting) this.cachedMatrix = deltaMatrix
    else this.localMatrix = Matrix3x3.multiply(deltaMatrix, this.localMatrix)

    this.updateWorldTransform()
  }

  public updateWorldTransform(): void {
    const parent = this.parent()
    const children = this.children()

    if (parent) this.worldMatrix = Matrix3x3.multiply(parent.worldMatrix, this.localMatrix)
    else this.worldMatrix = this.localMatrix.clone()

    this.worldMatrix = Matrix3x3.compose(this.worldMatrix, this.__testMatrix)

    this.updateAfterTransform()
    children.forEach((child) => child.updateWorldTransform())
  }

  public addClassname(classname: string): void {
    if (this.includeClassname(classname)) return
    this.classList.push(classname)
  }

  public includeClassname(classname: string): boolean {
    return this.classList.includes(classname)
  }

  public children(): Array<SimObject>
  public children(...list: Array<SimObject>): void
  public children(...list: Array<SimObject>): Array<SimObject> | void {
    if (isEmpty(list)) return this._children

    list.forEach((child) => {
      this._children.push(child)
      this.fire("addChild", { child })

      child.parent(this)
    })
  }

  public parent(): SimObject | null
  public parent(parent: SimObject): void
  public parent(parent?: SimObject): SimObject | null | void {
    if (isUndefined(parent)) return this._parent
    this._parent = parent
  }

  public getLayerOrThrow(): Layer {
    const layer = this.layer()
    if (isNull(layer)) throw new Error("23")
    return layer
  }

  public layer(): Layer | null
  public layer(layer: Layer): void
  public layer(layer?: Layer): Layer | null | void {
    if (isUndefined(layer)) return this._layer

    this._layer = layer
    this._children.forEach((child) => child.layer(layer))
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
      .filter((child) => child.includeClassname(name))
  }

  public getFlatListChildren(): Array<SimObject> {
    const children = this.children()

    return children.flatMap((child) => (
      Group.isGroup(child)
        ? this.getFlatListChildren.call(child)
        : child
    ))
  }

  public getAllParents<T extends SimObject>(list: Array<T> = []): Array<T> {
    const parent = this.parent() as unknown as T

    return isNull(parent)
      ? list
      : this.getAllParents.call(parent, list.concat(parent)) as Array<T>
  }

  public render(context: CanvasRenderingContext2D): void {
    this.children().forEach((child) => child.render(context))
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    this.children().forEach((child) => child.renderHit(context))
  }

  public drawInOffscreen(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    this.children().forEach((child) => child.drawInOffscreen(context))
  }

  public onStart(_event: PointerEvent): void {
    this.beginInteraction("translate")
    this.fire("startDrag")
  }

  public onProcess(_event: PointerEvent): void {
    this.updateInteraction(this._translate)
    this.getAllParents().forEach((parent) => parent.updateAfterTransform?.())
    this.eventBus.emit(this.eventRoutes.changePosition())
    this.fire("processDrag")
  }

  public onFinish(__event: PointerEvent): void {
    this.endInteraction()
    this.getAllParents().forEach((parent) => parent.updateAfterTransform?.())
    this.eventBus.emit(this.eventRoutes.finishDrag())
    this.fire("finishDrag")
  }
}

