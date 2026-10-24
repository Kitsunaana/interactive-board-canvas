import {NodeTransformer} from "../behaviors/NodeTransformer"
import {Matrix3x3, Point, type PointData} from "../maths"
import type {Container} from "./Container";
import {routes, type SafeParams} from "./Node";

export abstract class SimObject extends NodeTransformer {
  private _isDestroyed = false
  public get x() {
    return this.position.x
  }

  public get y() {
    return this.position.y
  }

  public get position(): Point {
    return this.getBounds().point()
  }
  
  public set x(value: number) {
    this.position = {
      x: value,
      y: this.position.y,
    }
  }

  public set y(value: number) {
    this.position = {
      x: this.position.x,
      y: value,
    }
  }

  public set position(nextPos: PointData) {
    this.translate(Point.fromData(nextPos).sub(this.position))
  }

  public isTransformPreviewActive(): boolean {
    let current: SimObject | null = this

    while (current) {
      if (current.isInteracting) return true
      current = current.parent
    }

    return false
  }

  public tryApplyPreviewMatrixToContext(context: CanvasRenderingContext2D): void {
    if (this.isInteracting) {
      this
        .getPreviewWorldMatrix()
        .applyToContext(context)
    }
  }

  public applyDeltaTransform(deltaMatrix: Matrix3x3): void {
    if (this.isInteracting) this.cachedMatrix = deltaMatrix
    else this.localMatrix = Matrix3x3.multiply(deltaMatrix, this.localMatrix)

    this.updateWorldTransform()
  }

  public updateWorldTransform(): void {
    const parent = this.parent

    const effectiveLocal = this.isInteracting
      ? Matrix3x3.multiply(this.cachedMatrix, this.localMatrix)
      : this.localMatrix

    this.worldMatrix = parent ? Matrix3x3.multiply(parent.worldMatrix, effectiveLocal) : effectiveLocal.clone()

    this.updateAfterTransform()
  }

  public remove(): this {
    this.parent?.removeChild(this)
    this.emitter.emit(routes.remove())
    return this
  }

  public destroy(): void {
    if (this._isDestroyed) return
    this._isDestroyed = true

    this.remove()
    this.off()
    this.emitter.emit(routes.destroy())
    this.emitter.dispose()
  }

  public moveTo(parent: Container): void {
    parent.appendChild(this.remove())
  }
  
  public setAttribute<T extends this, K extends keyof SafeParams<this>>(key: K, value: T[K]) {
    super.setAttribute(key, value)
  
    switch (key) {
      case "parent": {
        if (value) this.moveTo(value as unknown as Container)
        else this.remove()
        return
      }

      case "cachedMatrix":
      case "currentRelativeOrigins":
      case "interactionOperation":
      case "isInteracting":
      case "localMatrix":
      case "position":
      case "startWorldMatrix":
      case "worldMatrix":
      case "x":
      case "y": {
        this[key] = value
      }
    }
  }
}