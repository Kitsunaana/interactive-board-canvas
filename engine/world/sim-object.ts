import { defaultTo, isEmpty, isNull, isUndefined } from "lodash";
import { nanoid } from "nanoid";
import { Mixin } from "ts-mixer";
import { Draggable } from "../behaviors/Draggable";
import { EventBehavior } from "../behaviors/EventBehavior";
import { Transformable } from "../behaviors/Transformable";
import type { Layer } from "../Layer";
import { Matrix3x3, Point, type PointData, type Rectangle } from "../maths";
import type { Sizes } from "../Stage";

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

export abstract class SimObject extends Mixin(Transformable, Draggable, EventBehavior) {
  public abstract getBounds(params?: GetBoundsParams): Rectangle
  public abstract getUnrotateBounds(): Rectangle
  public abstract updateAfterTransform(): void

  private _cacheConfig: Required<CacheConfig> | null = null

  public id: string = nanoid()
  public classList: Array<string> = []

  public isCached: boolean = false
  public isCacheDirty: boolean = true

  public cachedMatrix: Matrix3x3 = Matrix3x3.identity()
  public worldMatrix: Matrix3x3 = Matrix3x3.identity()
  public localMatrix: Matrix3x3 = Matrix3x3.identity()

  protected _children: Array<SimObject> = []
  protected _parent: SimObject | null = null
  protected _layer: Layer | null = null

  protected cachedCanvas: OffscreenCanvas | null = null
  protected offContext: OffscreenCanvasRenderingContext2D | null = null

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

  public getCurrentAngle(): number {
    return Math.atan2(Math.abs(this.worldMatrix.b), Math.abs(this.worldMatrix.a))
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

  public layer(): Layer | null
  public layer(layer: Layer): void
  public layer(layer?: Layer): Layer | null | void {
    if (isUndefined(layer)) return this._layer

    this._layer = layer
    this._children.forEach((child) => child.layer(layer))
  }

  public getTransformedCorners(): Array<PointData> {
    const bounds = this.getBounds({ skipTransform: true })
    const matrix = this.worldMatrix

    return bounds.getCorners().map(matrix.applyToPoint.bind(matrix))
  }

  public getAllParents<T extends SimObject>(list: Array<T> = []): Array<T> {
    const parent = this.parent() as unknown as T

    return isNull(parent)
      ? list
      : this.getAllParents.call(parent, list.concat(parent)) as Array<T>
  }

  public render(context: CanvasRenderingContext2D): void {
    this._children.forEach((child) => {
      context.save()
      child.render(context)
      context.restore()
    })
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    this._children.forEach((child) => {
      context.save()
      child.renderHit(context)
      context.restore()
    })
  }

  public drawInOffscreen(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    this._children.forEach((child) => {
      context.save()
      child.drawInOffscreen(context)
      context.restore()
    })
  }
  

  public onStart(_event: PointerEvent): void {
    this.beginInteraction("translate")
  }

  public onProcess(_event: PointerEvent): void {
    this.updateInteraction(this._translate)
    this.getAllParents().forEach((parent) => parent.updateAfterTransform?.())
  }

  public onFinish(__event: PointerEvent): void {
    this.endInteraction()
    this.getAllParents().forEach((parent) => parent.updateAfterTransform?.())
  }

  public get cachedConfig(): Required<CacheConfig> {
    if (isNull(this._cacheConfig)) throw new Error("Не используется кеширование")
    return this._cacheConfig
  }

  public invalidateCache() {
    if (this.isCached) this.isCacheDirty = true
  }

  public clearCache() {
    this.cachedCanvas = null
    this.offContext = null

    this.isCached = false
    this.isCacheDirty = true

    this._cacheConfig = null
  }

  public cache(config: CacheConfig = {}) {
    const parseDimension = (dimension: keyof Sizes, bounds: Rectangle) => Number(config[dimension]) > 0 ? config[dimension] : bounds[dimension]

    const position = new Point(config.x, config.y)
    const bounds = this.getBounds({ skipTransform: false }).padding(defaultTo(config.offset, 0))
    const sizes = new Point(parseDimension("width", bounds), parseDimension("height", bounds))

    this.cachedCanvas = new OffscreenCanvas(...sizes.array())
    this.offContext = this.cachedCanvas.getContext("2d")

    if (this.offContext !== null) {
      this.offContext.translate(-bounds.x + position.x, -bounds.y + position.y)
      this.offContext.imageSmoothingEnabled = Boolean(config.imageSmoothingEnabled)

      this.drawInOffscreen(this.offContext)

      this.isCached = true
      this.isCacheDirty = false

      this._cacheConfig = {
        ...config,
        ...position,
        ...sizes.size(),
        offset: config.offset ?? 0,
        drawBorder: Boolean(config.imageSmoothingEnabled),
        imageSmoothingEnabled: Boolean(config.imageSmoothingEnabled),
      }
    }
  }
}

