import type { EventObject } from "../../behaviors/EventBehavior"
import { Layer } from "../../Layer"
import { EllipseShape } from "../../shapes/Ellipse"
import { pointFromEvent } from "../../shared/point"
import { mapKeys } from "../../utils"
import { BaseTransformOperation, } from "./base-transform-operation"
import type { Corner, TransformOperationModel } from "./transform-operation.interface"

const r = 5
const r2 = 9

export class RotateTransformOpearation extends BaseTransformOperation implements TransformOperationModel {
  private _initialPointerAngle: number = 0

  private readonly _rotateHandlerShapes: Record<Corner, EllipseShape> = {
    "bottomRight": new EllipseShape(0, 0, r2, r2),
    "bottomLeft": new EllipseShape(0, 0, r2, r2),
    "topRight": new EllipseShape(0, 0, r2, r2),
    "topLeft": new EllipseShape(0, 0, r2, r2),
  }

  public addHandlersToLayer(layer: Layer) {
    mapKeys(this._rotateHandlerShapes, (_, shape) => {
      shape.on("pointerdown", this.startTransform.bind(this))
      layer.add(shape);
    });

    this.updateHandlersPosition()
  }

  public updateHandlersPosition() {
    const padding = 7 + r * 2
    const positions = this.computeTransformHandlerPositions(padding).corner;

    mapKeys(this._rotateHandlerShapes, (handler, shape) => {
      shape.position(positions[handler])
    })
  }

  public startTransform(event: EventObject) {
    this.box.transformState = "rotate"

    this.box.beginInteraction("rotate");

    const mousePos = pointFromEvent(event.evt as PointerEvent)
    const originRotate = this.box.getInWorldOriginPosition("rotate")
    const direction = mousePos.sub(originRotate)
    const currentAngle = Math.atan2(direction.y, direction.x)

    this._initialPointerAngle = currentAngle
  }

  public processTransform(event: PointerEvent) {
    const originRotate = this.box.getInWorldOriginPosition("rotate")
    const mousePos = pointFromEvent(event)

    const direction = mousePos.sub(originRotate)
    const currentAngle = Math.atan2(direction.y, direction.x)
    const targetRotation = (currentAngle - this._initialPointerAngle)

    this.box.updateInteraction(targetRotation)
    this.box.updateHandlersPosition()
  }

  public finishTransform() {
    this.box.endInteraction()
    this.box.updateHandlersPosition()

    this._initialPointerAngle = 0
    this.box.transformState = "idle"
  }
}