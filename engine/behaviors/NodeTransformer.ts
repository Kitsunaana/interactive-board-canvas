import {isNumber} from "lodash"
import {Matrix3x3, Point, type PointData, Rectangle} from "../maths"
import type {GetBoundsParams} from "../core/Node"

export type TransformOperation = "scale" | "skew" | "rotate" | "translate"

type NodeToTransformImpl = {
  parent: NodeToTransformImpl | null
  transform: NodeTransformer

  getBounds(params?: GetBoundsParams): Rectangle
  updateWorldTransform(): void
}

type InteractionSnapshot = {
  operation: TransformOperation
  startLocal: Matrix3x3
  startWorld: Matrix3x3
  startParentWorld: Matrix3x3
  originWorld: PointData
}

export const EPSILON = 1e-10

export const inverseOrIdentity = (matrix: Matrix3x3) => Matrix3x3.invert(matrix) ?? Matrix3x3.identity()

export const inverseOrThrow = (matrix: Matrix3x3, message: string = "Cannot transform"): Matrix3x3 => {
  const inverse = Matrix3x3.invert(matrix)
  if (!inverse) throw new Error(message)
  return inverse
}

export const worldDeltaToParentSpace = (deltaWorld: Matrix3x3, parentWorld: Matrix3x3): Matrix3x3 => {
  const parentInverse = inverseOrThrow(parentWorld, "Cannot transform a node whose parent world matrix is singular.")
  return Matrix3x3.compose(parentInverse, deltaWorld, parentWorld)
}

export const aroundWorldOrigin = (origin: PointData, operation: Matrix3x3): Matrix3x3 => {
  return Matrix3x3.compose(
    Matrix3x3.translate(origin.x, origin.y),
    operation,
    Matrix3x3.translate(-origin.x, -origin.y),
  )
}

export const inWorldAxes = (world: Matrix3x3, operation: Matrix3x3): Matrix3x3 => {
  const basis = world.getLinearMatrix()
  const inverseBasis = inverseOrThrow(basis, "Cannot scale or skew an object whose world transform has a singular linear part.")
  return Matrix3x3.compose(basis, operation, inverseBasis)
}

export class NodeTransformer {
  public localMatrix: Matrix3x3 = Matrix3x3.identity()
  public worldMatrix: Matrix3x3 = Matrix3x3.identity()
  public cachedMatrix: Matrix3x3 = Matrix3x3.identity()

  public currentRelativeOrigins: Record<TransformOperation, Point> = {
    translate: new Point(0, 0),
    rotate: new Point(0.5, 0.5),
    scale: new Point(0, 0),
    skew: new Point(0.5, 0.5),
  }

  public interactionOperation: TransformOperation | null = null
  public isInteracting = false

  private interactionSnapshot: InteractionSnapshot | null = null

  public constructor(private readonly node: NodeToTransformImpl) {
  }

  public getCurrentAngle(): number {
    const {a, b} = this.worldMatrix
    if (Math.hypot(a, b) < EPSILON) return 0
    return Math.atan2(b, a)
  }

  public setInitialRelativeOrigins(): void {
    this.currentRelativeOrigins.rotate.set(0.5, 0.5)
    this.currentRelativeOrigins.scale.set(0, 0)
    this.currentRelativeOrigins.skew.set(0.5, 0.5)
  }

  public setOrigin(operation: TransformOperation, relativeOrigin: PointData): void {
    this.currentRelativeOrigins[operation].set(relativeOrigin.x, relativeOrigin.y)
  }

  public getOriginInOriginalSpace(operation: TransformOperation): Point {
    const bounds = this.node.getBounds({skipTransform: true})
    const relative = this.currentRelativeOrigins[operation]

    return new Point(
      bounds.x + bounds.width * relative.x,
      bounds.y + bounds.height * relative.y,
    )
  }

  public getInWorldOriginPosition(operation: TransformOperation): Point {
    const localOrigin = this.getOriginInOriginalSpace(operation)
    const world = this.isInteracting && this.interactionSnapshot
      ? this.interactionSnapshot.startWorld
      : this.worldMatrix

    return world.applyToPoint(localOrigin)
  }

  public getInLocalOriginPosition(operation: TransformOperation): Point {
    return this.localMatrix.applyToPoint(this.getOriginInOriginalSpace(operation))
  }

  public getPreviewWorldMatrix(): Matrix3x3 {
    if (!this.isInteracting || !this.interactionSnapshot) return Matrix3x3.identity()

    const invStart = inverseOrIdentity(this.interactionSnapshot.startWorld)
    return Matrix3x3.multiply(this.worldMatrix, invStart)
  }

  public get startWorldMatrix(): Matrix3x3 | null {
    return this.interactionSnapshot?.startWorld ?? null
  }

  private applyWorldDelta(deltaWorld: Matrix3x3): void {
    const parentWorld = this.isInteracting && this.interactionSnapshot
      ? this.interactionSnapshot.startParentWorld
      : this.node.parent?.transform.worldMatrix ?? Matrix3x3.identity()

    const deltaLocal = worldDeltaToParentSpace(deltaWorld, parentWorld)

    if (this.isInteracting) this.cachedMatrix = deltaLocal
    else this.localMatrix = Matrix3x3.multiply(deltaLocal, this.localMatrix)

    this.node.updateWorldTransform()
  }

  public rotate(angle: number): void {
    const origin = this.isInteracting && this.interactionSnapshot
      ? this.interactionSnapshot.originWorld
      : this.getInWorldOriginPosition("rotate")

    this.applyWorldDelta(aroundWorldOrigin(origin, Matrix3x3.rotate(angle)))
  }

  public scale(scale: PointData): void {
    const snapshot = this.isInteracting ? this.interactionSnapshot : null
    const world = snapshot?.startWorld ?? this.worldMatrix
    const origin = snapshot?.originWorld ?? this.getInWorldOriginPosition("scale")
    const localAxesScale = inWorldAxes(world, Matrix3x3.scale(scale.x, scale.y))

    this.applyWorldDelta(aroundWorldOrigin(origin, localAxesScale))
  }

  public translate(distance: PointData): void {
    this.applyWorldDelta(Matrix3x3.translate(distance.x, distance.y))
  }

  public skew(value: PointData): void {
    const snapshot = this.isInteracting ? this.interactionSnapshot : null
    const world = snapshot?.startWorld ?? this.worldMatrix
    const origin = snapshot?.originWorld ?? this.getInWorldOriginPosition("skew")
    const localAxesSkew = inWorldAxes(world, Matrix3x3.skew(value.x, value.y))

    this.applyWorldDelta(aroundWorldOrigin(origin, localAxesSkew))
  }

  public beginInteraction(type: TransformOperation): void {
    if (this.isInteracting) this.endInteraction()

    const parentWorld = this.node.parent?.transform.worldMatrix.clone() ?? Matrix3x3.identity()
    const startWorld = this.worldMatrix.clone()
    const localOrigin = this.getOriginInOriginalSpace(type)
    const originWorld = startWorld.applyToPoint(localOrigin)

    this.interactionSnapshot = {
      operation: type,
      startLocal: this.localMatrix.clone(),
      startParentWorld: parentWorld,
      originWorld,
      startWorld,
    }

    this.interactionOperation = type
    this.isInteracting = true
    this.cachedMatrix = Matrix3x3.identity()
  }

  public updateInteraction(value: PointData | number): false | void {
    if (!this.isInteracting || !this.interactionOperation || !this.interactionSnapshot) return false

    switch (this.interactionOperation) {
      case "rotate":
        if (!isNumber(value)) return false
        this.rotate(value)
        return
      case "scale":
      case "skew":
      case "translate":
        if (isNumber(value)) return false
        this[this.interactionOperation](value)
        return
    }
  }

  public endInteraction(): void {
    if (!this.isInteracting || !this.interactionSnapshot) return

    this.localMatrix = Matrix3x3.multiply(this.cachedMatrix, this.interactionSnapshot.startLocal)
    this.cachedMatrix = Matrix3x3.identity()
    this.isInteracting = false
    this.interactionOperation = null
    this.interactionSnapshot = null
    this.node.updateWorldTransform()
  }

  public cancelInteraction(): void {
    if (!this.isInteracting || !this.interactionSnapshot) return

    this.localMatrix = this.interactionSnapshot.startLocal.clone()
    this.cachedMatrix = Matrix3x3.identity()
    this.isInteracting = false
    this.interactionOperation = null
    this.interactionSnapshot = null
    this.node.updateWorldTransform()
  }
}
