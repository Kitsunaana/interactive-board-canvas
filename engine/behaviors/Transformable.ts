import { Matrix3x3, Point, Rectangle, type PointData } from "../maths"
import type { GetBoundsParams } from "../world/sim-object"

export type TramsformOperation = "scale" | "skew" | "rotate" | "translate"

export const TRANSFORM_OPERATIONS = ["rotate", "skew", "scale", "translate"] as Array<TramsformOperation>

export type TransformScaleInstruction = {
  type: "scale"
  value: Point
  points: Array<PointData>
  relativeOrigin: PointData
}

export type TransformSkewInstruction = {
  type: "skew"
  value: Point
  points: Array<PointData>
  relativeOrigin: PointData
}

export type TransformRotateInstruction = {
  type: "rotate"
  value: Point
  points: Array<PointData>
  relativeOrigin: PointData
}

export type TransformTranslateInstruction = {
  type: "translate"
  value: Point
  points: Array<PointData>
  relativeOrigin: PointData
}

export type TransformInstruction =
  | TransformScaleInstruction
  | TransformSkewInstruction
  | TransformRotateInstruction
  | TransformTranslateInstruction

export const buildInitialOpearationsRecord = (): Record<TramsformOperation, Point> => ({
  translate: new Point(),
  rotate: new Point(),
  scale: new Point(),
  skew: new Point(),
})

export abstract class Transformable {
  public abstract getBounds(params: GetBoundsParams): Rectangle
  public abstract applyDeltaTransform(deltaMatrix: Matrix3x3): void
  public abstract parent(): Transformable | null

  public abstract localMatrix: Matrix3x3
  public abstract worldMatrix: Matrix3x3

  public currentRelativeOrigins = buildInitialOpearationsRecord()
  public isInteracting: boolean = false

  public constructor() {
    this.setInitialRelativeOrigins()
  }

  public setInitialRelativeOrigins(): void {
    this.currentRelativeOrigins.rotate.set(0.5, 0.5)
    this.currentRelativeOrigins.scale.set(0.0, 0.0)
    this.currentRelativeOrigins.skew.set(1.0, 1.0)
  }

  public setOrigin(operation: TramsformOperation, relativeOrigin: PointData): void {
    this.currentRelativeOrigins[operation].set(relativeOrigin.x, relativeOrigin.y)
  }

  public getInWorldOriginPoisition(operation: TramsformOperation) {
    return this.worldMatrix.applyToPoint(this.getOriginInOriginalSpace(operation))
  }

  public getInLocalOriginPosition(operation: TramsformOperation) {
    return this.localMatrix.applyToPoint(this.getOriginInOriginalSpace(operation))
  }

  public getOriginInOriginalSpace(operation: TramsformOperation) {
    const bounds = this.getBounds({ skipTransform: true })
    const relativeOrigin = this.currentRelativeOrigins[operation]

    return {
      x: bounds.x + bounds.width * relativeOrigin.x,
      y: bounds.y + bounds.height * relativeOrigin.y
    }
  }

  public rotate(angle: number) {
    const rotateOrigin = this.getInLocalOriginPosition("rotate")
    const delta = Matrix3x3.aroundOrigin(rotateOrigin, () => Matrix3x3.rotate(angle))

    this.applyDeltaTransform(delta)
  }

  public scale(scale: PointData) {
    const scaleOrigin = this.getInLocalOriginPosition("scale")
    const currentAngle = Math.atan2(this.worldMatrix.b, this.worldMatrix.a)

    const delta = Matrix3x3.aroundOrigin(scaleOrigin, () => {
      const rotation = Matrix3x3.rotate(currentAngle)
      const inverseRotation = Matrix3x3.rotate(-currentAngle)
      const operation = Matrix3x3.scale(scale.x, scale.y)

      return Matrix3x3.compose(rotation, operation, inverseRotation)
    })

    this.applyDeltaTransform(delta)
  }

  public translate(distance: PointData): void {
    const parent = this.parent()

    const parentAngle = parent
      ? Math.atan2(Math.abs(parent.worldMatrix.b), Math.abs(parent.worldMatrix.a))
      : 0

    const unrotate = Matrix3x3.rotate(-parentAngle)
    const delta = Matrix3x3.translate(...unrotate.applyToPoint(distance).array())

    this.applyDeltaTransform(delta)
  }

  public skew(skew: Point): void {
    // TODO
  }

  public beginInteraction(type: TramsformOperation): void {
    this.isInteracting = true
  }

  public updateInteraction(value: Point | PointData): void {
    if (!this.isInteracting) return

    this.scale(value)
  }

  public endInteraction(): void {
    this.isInteracting = false
    this.localMatrix = Matrix3x3.multiply(this.cachedMatrix, this.localMatrix)
    this.cachedMatrix = Matrix3x3.identity()

    this.updateWorldTransform()
  }
}

export function drawOriginPoint(context: CanvasRenderingContext2D, point: PointData, caption: string) {
  context.beginPath()
  context.font = "14px Roboto"
  context.textAlign = "center"
  context.textBaseline = "bottom"
  context.fillText(caption, point.x, point.y - 5)
  context.arc(point.x, point.y, 5, 0, Math.PI * 2)
  context.stroke()
  context.beginPath()
  context.arc(point.x, point.y, 2, 0, Math.PI * 2)
  context.fill()
}
