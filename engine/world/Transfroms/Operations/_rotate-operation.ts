import type { TransformOperation, TransformContext } from "./_operation.interface"

export class RotateOperation implements TransformOperation {
  private _initialPointerAngle: number = 0

  public start(context: TransformContext): void {
    context.target.transform.beginInteraction("rotate");

    const pointerPosition = context.target.layer.worldPointer

    const originRotate = context.target.transform.getInWorldOriginPosition("rotate")
    const direction = pointerPosition.sub(originRotate)
    const currentAngle = Math.atan2(direction.y, direction.x)

    this._initialPointerAngle = currentAngle
  }

  public process(context: TransformContext): void {
    const originRotate = context.target.transform.getInWorldOriginPosition("rotate")
    const pointerPosition = context.target.layer.worldPointer

    const direction = pointerPosition.sub(originRotate)
    const currentAngle = Math.atan2(direction.y, direction.x)
    const targetRotation = currentAngle - this._initialPointerAngle

    context.target.transform.updateInteraction(targetRotation)
    context.updateHandlePositions()
  }

  public finish(context: TransformContext): void {
    context.target.transform.endInteraction()
    this._initialPointerAngle = 0
  }
}
