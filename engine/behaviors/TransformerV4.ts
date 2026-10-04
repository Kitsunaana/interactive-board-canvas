import { isNumber, isObject } from "lodash"
import { Matrix3x3, Point, type PointData, Rectangle } from "../maths"
import type { GetBoundsParams } from "../core/Node"

export type TransformOperation = "scale" | "skew" | "rotate" | "translate"

export const buildInitialOperationsRecord = (): Record<TransformOperation, Point> => ({
  translate: new Point(),
  rotate: new Point(),
  scale: new Point(),
  skew: new Point(),
})

type GetOriginInOriginalSpaceParams = {
  bounds: Rectangle
  origin: PointData
}

type GetScaleDeltaMatrixParams = {
  origin: PointData
  scale: PointData
  angle: number

  transform: Matrix3x3
}

type GetRotateDeltaMatrixParams = {
  origin: PointData
  angle: number
}

type GetTranslateDeltaMatrixParams = {
  parent: NodeToTransformImpl | null,
  distance: PointData
}

interface NodeToTransformImpl {
  parent: NodeToTransformImpl | null
  transform: Transformer

  getBounds(params: GetBoundsParams): Rectangle
  applyDeltaTransform(deltaMatrix: Matrix3x3): void
  updateWorldTransform(): void
}

export const getOriginInOriginalSpace = ({ bounds, origin }: GetOriginInOriginalSpaceParams) => {
  return Point
    .fromSize(bounds)
    .mul(origin)
    .add(bounds)
}

export const getRotateDeltaMatrix = ({ origin, angle }: GetRotateDeltaMatrixParams) => {
  return Matrix3x3.aroundOrigin(origin, () => Matrix3x3.rotate(angle))
}

export const getScaleDeltaMatrix = ({ transform, origin, scale }: GetScaleDeltaMatrixParams): Matrix3x3 => {
  return Matrix3x3.aroundOrigin(origin, () => {
    const inverse = Matrix3x3.invert(transform)
    if (!inverse) return Matrix3x3.identity()
    const operation = Matrix3x3.scale(scale.x, scale.y)
    return Matrix3x3.compose(transform, operation, inverse)
  })
}

export const getTranslateDeltaMatrix = ({ parent, distance }: GetTranslateDeltaMatrixParams) => {
  if (parent) {
    const worldTranslate = Matrix3x3.translate(distance.x, distance.y)
    const parentWorldInverse = Matrix3x3.invert(parent.transform.worldMatrix) ?? Matrix3x3.identity()

    return Matrix3x3.multiply(
      parentWorldInverse,
      Matrix3x3.multiply(worldTranslate, parent.transform.worldMatrix)
    )
  } else {
    return Matrix3x3.translate(distance.x, distance.y)
  }
}

export class Transformer {
  public __testMatrix: Matrix3x3 = Matrix3x3.identity()
  public localMatrix: Matrix3x3 = Matrix3x3.identity()
  public worldMatrix: Matrix3x3 = Matrix3x3.identity()
  public cachedMatrix: Matrix3x3 = Matrix3x3.identity()

  public currentRelativeOrigins = buildInitialOperationsRecord()

  public interactionOperation: TransformOperation | null = null
  public isInteracting: boolean = false

  public constructor(private readonly node: NodeToTransformImpl) {
    this.setInitialRelativeOrigins()
  }

  public getCurrentAngle(): number {
    const a = this.worldMatrix.a
    const b = this.worldMatrix.b

    const lenX = Math.hypot(a, b)

    const cosTheta = a / lenX
    const sinTheta = b / lenX

    return Math.atan2(sinTheta, cosTheta)
  }

  public setInitialRelativeOrigins(): void {
    this.currentRelativeOrigins.rotate.set(0.5, 0.5)
    this.currentRelativeOrigins.scale.set(0.0, 0.0)
    this.currentRelativeOrigins.skew.set(0.5, 0.5)
  }

  public setOrigin(operation: TransformOperation, relativeOrigin: PointData): void {
    this.currentRelativeOrigins[operation].set(relativeOrigin.x, relativeOrigin.y)
  }

  public getInWorldOriginPosition(operation: TransformOperation): Point {
    return this.worldMatrix.applyToPoint(this.getOriginInOriginalSpace(operation))
  }

  public getInLocalOriginPosition(operation: TransformOperation): Point {
    return this.localMatrix.applyToPoint(this.getOriginInOriginalSpace(operation))
  }

  public getOriginInOriginalSpace(operation: TransformOperation): Point {
    const bounds = this.node.getBounds({ skipTransform: true })
    const relativeOrigin = this.currentRelativeOrigins[operation]

    return Point
      .fromSize(bounds)
      .mul(relativeOrigin)
      .add(bounds)
  }

  public rotate(angle: number): void {
    const origin = this.getInLocalOriginPosition("rotate")
    const deltaMatrix = getRotateDeltaMatrix({ origin, angle })

    this.node.applyDeltaTransform(deltaMatrix)
  }

  public scale(scale: PointData): void {
    const angle = this.getCurrentAngle()
    const origin = this.getInLocalOriginPosition("scale")
    const delta = getScaleDeltaMatrix({
      transform: this.node.transform.worldMatrix.getLinearMatrix(),
      origin,
      angle,
      scale,
    })

    this.node.applyDeltaTransform(delta)
  }

  public translate(distance: PointData): void {
    const parent = this.node.parent
    const deltaMatrix = getTranslateDeltaMatrix({ distance, parent })

    this.node.applyDeltaTransform(deltaMatrix)
  }

  public skew(value: PointData): void {
    const origin = this.getInLocalOriginPosition("skew")
    const deltaMatrix = Matrix3x3.aroundOrigin(origin, () => Matrix3x3.skew(value.x, value.y))

    this.node.applyDeltaTransform(deltaMatrix)
  }

  public beginInteraction(type: TransformOperation): void {
    this.isInteracting = true
    this.interactionOperation = type
  }

  public updateInteraction(value: PointData | number): false | void {
    if (!this.isInteracting) return false

    switch (this.interactionOperation) {
      case "rotate":
        return isNumber(value) && this.rotate(value)

      case "skew":
      case "scale":
      case "translate":
        return isObject(value) && this[this.interactionOperation](value)
    }
  }

  public endInteraction(): void {
    this.isInteracting = false
    this.interactionOperation = null

    this.localMatrix = Matrix3x3.multiply(this.cachedMatrix, this.localMatrix)
    this.cachedMatrix = Matrix3x3.identity()

    this.node.updateWorldTransform()
  }
}
