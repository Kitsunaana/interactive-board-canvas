import type { EventObject } from "../../behaviors/EventBehavior"
import { pointFromEvent } from "../../shared/point"
import { SimObject } from "../sim-object"
import type { Transformer } from "../TransformerV2"

export class RotateTransformOperation {
  private _initialPointerAngle: number = 0

  public constructor(public context: Transformer, public node: SimObject) { }

  public startTransform(event: EventObject<PointerEvent>): void {
    this.context.transformState = "rotate"
    this.node.beginInteraction("rotate");

    const pointerPosition = pointFromEvent(event.evt)

    this.node.layer
      .screenToWorld(pointerPosition)
      .copyTo(pointerPosition)

    const originRotate = this.node.getInWorldOriginPosition("rotate")
    const direction = pointerPosition.sub(originRotate)
    const currentAngle = Math.atan2(direction.y, direction.x)

    this._initialPointerAngle = currentAngle
  }

  public processTransform(event: PointerEvent): void {
    const originRotate = this.node.getInWorldOriginPosition("rotate")
    const pointerPosition = pointFromEvent(event)

    this.node.layer
      .screenToWorld(pointerPosition)
      .copyTo(pointerPosition)

    const direction = pointerPosition.sub(originRotate)
    const currentAngle = Math.atan2(direction.y, direction.x)
    const targetRotation = currentAngle - this._initialPointerAngle

    this.node.updateInteraction(targetRotation)
    this.context.updateHandlersPosition()
  }

  public finishTransform(): void {
    this.node.endInteraction()

    this.context.updateHandlersPosition()
    this.context.transformState = "idle"

    this._initialPointerAngle = 0
  }
}