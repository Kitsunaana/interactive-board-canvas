import {NodeTransformer} from "../behaviors/NodeTransformer"
import {Matrix3x3, Point, type PointData} from "../maths"
import type {Container} from "./Container";
import {routes} from "./Node";

export abstract class SimObject extends NodeTransformer {
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
    this.remove()
    this.off()
    this.emitter.emit(routes.destroy())
    this.emitter.dispose()
  }

  public moveTo(parent: Container): void {
    parent.appendChild(this.remove())
  }
}