import { Matrix3x3, Point } from "../../../maths"
import type { Edge, TransformContext, TransformOperation } from "./_operation.interface"

export class SkewOperation implements TransformOperation {
  public start(context: TransformContext): void {
    context.target.transform.beginInteraction("skew")
  }

  public finish(context: TransformContext): void {
    context.target.transform.endInteraction()
  }

  public process(context: TransformContext): void {
    const side = context.pickedHandler as Edge

    const bounds = context.target.getBounds({ skipTransform: true, })
    const transform = context.target.transform
    const local = transform.localMatrix

    const parent = context.target.parent?.transform.worldMatrix ?? Matrix3x3.identity()
    const parentInverse = Matrix3x3.invert(parent)

    if (!parentInverse) return

    const cursor = parentInverse.applyToPoint(context.target.layer.worldPointer)

    const corners = bounds
      .getCorners()
      .map((point) => local.applyToPoint(point))

    const [topLeft, topRight, bottomRight, bottomLeft] = corners

    let handle: Point
    let opposite: Point

    switch (side) {
      case "top":
        handle = topLeft.add(topRight).scale(0.5)
        opposite = bottomLeft.add(bottomRight).scale(0.5)
        break

      case "right":
        handle = topRight.add(bottomRight).scale(0.5)
        opposite = topLeft.add(bottomLeft).scale(0.5)
        break

      case "bottom":
        handle = bottomLeft.add(bottomRight).scale(0.5)
        opposite = topLeft.add(topRight).scale(0.5)
        break

      case "left":
        handle = topLeft.add(bottomLeft).scale(0.5)
        opposite = topRight.add(bottomRight).scale(0.5)
        break
    }

    const originOriginal = transform.getOriginInOriginalSpace("skew")
    const origin = local.applyToPoint(originOriginal)

    const inverseLocal = Matrix3x3.invert(local)
    if (!inverseLocal) return

    const localCursor = inverseLocal.applyToPoint(cursor)
    const localOrigin = inverseLocal.applyToPoint(origin)
    const localHandle = inverseLocal.applyToPoint(handle)
    const localOpposite = inverseLocal.applyToPoint(opposite)

    const cursorVector = localCursor.sub(localOrigin)
    const handleVector = localHandle.sub(localOrigin)
    const oppositeVector = localOpposite.sub(localOrigin)

    let crossedOpposite = false

    if (side === "right" || side === "left") {
      crossedOpposite = handleVector.x > oppositeVector.x
        ? cursorVector.x < oppositeVector.x
        : cursorVector.x > oppositeVector.x
    } else {
      crossedOpposite = handleVector.y > oppositeVector.y
        ? cursorVector.y < oppositeVector.y
        : cursorVector.y > oppositeVector.y
    }

    let handleAngle: number
    let cursorAngle: number

    if (side === "right" || side === "left") {
      handleAngle = Math.atan2(handleVector.x, handleVector.y)
      cursorAngle = Math.atan2(cursorVector.x, cursorVector.y)
    } else {
      handleAngle = Math.atan2(handleVector.y, handleVector.x)
      cursorAngle = Math.atan2(cursorVector.y, cursorVector.x)
    }

    let angle = handleAngle - cursorAngle

    while (angle > Math.PI) angle -= Math.PI * 2
    while (angle < -Math.PI) angle += Math.PI * 2

    if (crossedOpposite) {
      if (angle > 0) angle -= Math.PI
      else angle += Math.PI
    }

    const shear = Math.tan(angle)

    let kx = 0
    let ky = 0

    if (side === "top" || side === "bottom") kx = shear
    else ky = shear

    const skew = Matrix3x3.aroundOrigin(localOrigin, () => Matrix3x3.skew(kx, ky))
    const delta = Matrix3x3.compose(local, skew, inverseLocal)

    context.target.applyDeltaTransform(delta)
    context.updateHandlePositions()
  }
}