import {isNumber, isObject} from "lodash"
import {Matrix3x3, Point, type PointData, Rectangle} from "../maths"
import type {GetBoundsParams} from "../world/sim-object"

export type TransformOperation = "scale" | "skew" | "rotate" | "translate"


export const buildInitialOperationsRecord = (): Record<TransformOperation, Point> => ({
  translate: new Point(),
  rotate: new Point(),
  scale: new Point(),
  skew: new Point(),
})

export abstract class Transformable {
  public abstract getBounds(params: GetBoundsParams): Rectangle
  public abstract applyDeltaTransform(deltaMatrix: Matrix3x3): void
  public abstract updateWorldTransform(): void
  public abstract parent(): Transformable | null

  public abstract localMatrix: Matrix3x3
  public abstract worldMatrix: Matrix3x3
  public abstract cachedMatrix: Matrix3x3


  public currentRelativeOrigins = buildInitialOperationsRecord()

  public interactionOperation: TransformOperation | null = null
  public isInteracting: boolean = false

  public constructor() {
    this.setInitialRelativeOrigins()
  }

  public setInitialRelativeOrigins(): void {
    this.currentRelativeOrigins.rotate.set(0.5, 0.5)
    this.currentRelativeOrigins.scale.set(0.0, 0.0)
    this.currentRelativeOrigins.skew.set(1.0, 1.0)
  }

  public setOrigin(operation: TransformOperation, relativeOrigin: PointData): void {
    this.currentRelativeOrigins[operation].set(relativeOrigin.x, relativeOrigin.y)
  }

  public getInWorldOriginPoisition(operation: TransformOperation) {
    return this.worldMatrix.applyToPoint(this.getOriginInOriginalSpace(operation))
  }

  public getInLocalOriginPosition(operation: TransformOperation) {
    return this.localMatrix.applyToPoint(this.getOriginInOriginalSpace(operation))
  }

  public getOriginInOriginalSpace(operation: TransformOperation) {
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
    const parent = this.parent();

    if (parent) {
      const worldTranslate = Matrix3x3.translate(distance.x, distance.y);

      const parentWorldInverse = Matrix3x3.invert(parent.worldMatrix) ?? Matrix3x3.identity();
      const delta = Matrix3x3.multiply(parentWorldInverse, Matrix3x3.multiply(worldTranslate, parent.worldMatrix));

      this.applyDeltaTransform(delta);
    } else {
      const delta = Matrix3x3.translate(distance.x, distance.y);
      this.applyDeltaTransform(delta);
    }
  }


  public skew(_skew: PointData): void {
    // TODO
  }

  public beginInteraction(type: TransformOperation): void {
    this.isInteracting = true
    this.interactionOperation = type
  }

  public updateInteraction(value: PointData | number): false | void {
    if (!this.isInteracting) return false

    switch (this.interactionOperation) {
      case "rotate": return isNumber(value) && this.rotate(value)

      case "skew":
      case "scale":
      case "translate":
        return isObject(value) && this[this.interactionOperation](value)
    }
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
