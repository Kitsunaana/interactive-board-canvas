import { isEmpty, isNull, isUndefined } from "lodash";
import { nanoid } from "nanoid";
import { Mixin } from "ts-mixer";
import { EventBehavior } from "../behaviors/EventBehavior";
import { Transformable } from "../behaviors/Transformable";
import type { Layer } from "../Layer";
import { Matrix3x3, type PointData, Rectangle } from "../maths";

export type GetBoundsParams = {
  skipTransform?: boolean
}

export abstract class SimObject extends Mixin(Transformable, EventBehavior) {
  public abstract getBounds(params?: GetBoundsParams): Rectangle
  public abstract getUnrotateBounds(): Rectangle
  public abstract updateAfterTransform(): void

  public id: string = nanoid()
  public classList: Array<string> = []

  public cachedMatrix: Matrix3x3 = Matrix3x3.identity()

  public localMatrix: Matrix3x3 = Matrix3x3.identity()
  public worldMatrix: Matrix3x3 = Matrix3x3.identity()

  protected _children: Array<SimObject> = []
  protected _parent: SimObject | null = null
  protected _layer: Layer | null = null

  public applyDeltaTransform(deltaMatrix: Matrix3x3) {
    if (this.isInteracting) this.cachedMatrix = deltaMatrix
    else this.localMatrix = Matrix3x3.multiply(deltaMatrix, this.localMatrix)

    this.updateWorldTransform()
  }

  public updateWorldTransform() {
    const parent = this.parent()
    const children = this.children()

    if (parent) this.worldMatrix = Matrix3x3.multiply(parent.worldMatrix, this.localMatrix)
    else this.worldMatrix = this.localMatrix.clone()

    this.updateAfterTransform()
    children.forEach((child) => child.updateWorldTransform())
  }

  public addClassname(classname: string) {
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
}

