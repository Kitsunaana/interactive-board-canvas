import type { EventObject } from "../../behaviors/EventBehavior"
import { pointFromEvent } from "../../shared/point"
import { SimObject } from "../sim-object"
import type { TransformerV2 } from "../TransformerV2"

export class RotateTransformOpearation {
  private _initialPointerAngle: number = 0

  public constructor(public context: TransformerV2, public node: SimObject) { }

  public startTransform(event: EventObject) {
    this.context.transformState = "rotate"

    this.node.beginInteraction("rotate");

    const mousePos = pointFromEvent(event.evt as PointerEvent)
    const originRotate = this.node.getInWorldOriginPosition("rotate")
    const direction = mousePos.sub(originRotate)
    const currentAngle = Math.atan2(direction.y, direction.x)

    this._initialPointerAngle = currentAngle
  }

  public processTransform(event: PointerEvent) {
    const originRotate = this.node.getInWorldOriginPosition("rotate")
    const mousePos = pointFromEvent(event)

    const direction = mousePos.sub(originRotate)
    const currentAngle = Math.atan2(direction.y, direction.x)
    const targetRotation = (currentAngle - this._initialPointerAngle)

    this.node.updateInteraction(targetRotation)

    this.context.updateHandlersPosition()
  }

  public finishTransform() {
    this.node.endInteraction()

    this.context.updateHandlersPosition()
    this.context.transformState = "idle"

    this._initialPointerAngle = 0
  }
}