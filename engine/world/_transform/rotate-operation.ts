import type { EventObject } from "../../behaviors/EventBehavior_v2"
import { Node } from "../../core/Node"
import { pointFromEvent } from "../../shared/point"
import type { Transformer } from "../TransformerV2"

export class RotateTransformOperation {
  private _initialPointerAngle: number = 0

  public constructor(public context: Transformer, public node: Node) { }

  public startTransform(event: EventObject<PointerEvent>): void {
    this.context.transformState = "rotate"
    this.node.transform.beginInteraction("rotate");

    const pointerPosition = pointFromEvent(event.evt)

    this.node.layer
      .screenToWorld(pointerPosition)
      .copyTo(pointerPosition)

    const originRotate = this.node.transform.getInWorldOriginPosition("rotate")
    const direction = pointerPosition.sub(originRotate)
    const currentAngle = Math.atan2(direction.y, direction.x)

    this._initialPointerAngle = currentAngle
  }

  public processTransform(event: PointerEvent): void {
    const originRotate = this.node.transform.getInWorldOriginPosition("rotate")
    const pointerPosition = pointFromEvent(event)

    this.node.layer
      .screenToWorld(pointerPosition)
      .copyTo(pointerPosition)

    const direction = pointerPosition.sub(originRotate)
    const currentAngle = Math.atan2(direction.y, direction.x)
    const targetRotation = currentAngle - this._initialPointerAngle

    this.node.transform.updateInteraction(targetRotation)
    this.context.updateHandlersPosition()
  }

  public finishTransform(): void {
    this.node.transform.endInteraction()

    this.context.updateHandlersPosition()
    this.context.transformState = "idle"

    this._initialPointerAngle = 0
  }
}