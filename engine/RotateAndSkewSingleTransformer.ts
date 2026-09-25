import { isNil } from "lodash";
import { drawOriginPoint } from "./behaviors/Transformable";
import { Group } from "./core/Group";
import { routes } from "./core/Node";
import { Shape } from "./core/Shape";
import { Matrix3x3, Point } from "./maths";
import { CircleShape } from "./shapes/Circle";
import type { Edge } from "./world/_transform/transform-operation.interface";
import { SYSTEM_UI } from "./world/GradientControls/BaseGradientGroup";

const HANDLE_SIDES = ["bottom", "right", "left", "top"] as Array<Edge>

const HANDLER_NAME = "handler"

export class RotateAndSkewSingleTransformer extends Group {
  private _targetShape: Shape | null = null
  private _pickedHandler: Edge | null = null

  get pickedHandler() {
    if (isNil(this._pickedHandler)) throw new Error("Not exist picked handler")
    return this._pickedHandler
  }

  public get targetShape(): Shape {
    if (isNil(this._targetShape)) throw new Error("Child not found")
    return this._targetShape
  }

  public get handlers() {
    return this.children.filter((child) => child.hasName(SYSTEM_UI))
  }

  public constructor() {
    super()

    this.addName(SYSTEM_UI)

    this.emitter.on(routes.addChild, ({ payload }) => {
      const addedShape = payload.child
      if (addedShape.hasName(SYSTEM_UI)) return

      this._targetShape = addedShape as Shape
      this._addSkewHandlersToGroup()
    })
  }

  private _addSkewHandlersToGroup() {
    const handlePositions = this._getSkewHandlePosition()
    const addedShape = this.targetShape

    HANDLE_SIDES.forEach((side) => {
      const handler = new CircleShape({
        names: [SYSTEM_UI],
        radius: 5,
        x: 0,
        y: 0,
      })

      handler.position = addedShape.worldMatrix.applyToPoint(handlePositions[side]())
      handler.setDataAttr(HANDLER_NAME, side)
      handler.addName(SYSTEM_UI)

      this._attachDragEventsToHandlers(handler)
      this.appendChild(handler)
    })
  }

  private _attachDragEventsToHandlers(handler: Shape) {
    handler.emitter.on(routes.startDrag, this._startSkewDrag.bind(this))
    handler.emitter.on(routes.finishDrag, this._finishSkewDrag.bind(this))
    handler.emitter.on(routes.processDrag, this._processSkewDrag.bind(this))
  }

  private _getHandlersWithout(handler: Shape) {
    const handlers = this.handlers
    const foundIndex = handlers.indexOf(handler)
    if (foundIndex === -1) return handlers
    const prev = handlers.slice(0, foundIndex)
    const next = handlers.slice(foundIndex + 1)
    return prev.concat(next)
  }

  private _updateHandlePositions() {
    const targetShape = this.targetShape

    this.handlers.forEach((handler) => {
      const draggable = handler.draggable
      const nextPosition = draggable.startPosition.sub(draggable.startOffset)

      targetShape.cachedMatrix
        .applyToPoint(nextPosition)
        .copyTo(nextPosition)

      handler.position = nextPosition
    })
  }

  private _startSkewDrag({ payload }: ReturnType<typeof routes.startDrag>) {
    const handler = payload.target as Shape
    this._pickedHandler = handler.getDataAttr<Edge>("handler")
    this.targetShape.transform.beginInteraction("skew")

    this
      ._getHandlersWithout(handler)
      .forEach((shape) => shape.draggable.startDrag())
  }

  private _finishSkewDrag({ payload }: ReturnType<typeof routes.finishDrag>) {
    const handler = payload.target as Shape
    this.targetShape.transform.endInteraction()

    this
      ._getHandlersWithout(handler)
      .forEach((shape) => shape.draggable.finishDrag())
  }

  private _processSkewDrag() {
    const side = this.pickedHandler

    const bounds = this.targetShape.getBounds({ skipTransform: true, })
    const transform = this.targetShape.transform
    const local = transform.localMatrix

    const parent = this.targetShape.parent?.transform.worldMatrix ?? Matrix3x3.identity()
    const parentInverse = Matrix3x3.invert(parent)

    if (!parentInverse) return

    const cursor = parentInverse.applyToPoint(this.layer_v2.worldPointer)

    const corners = bounds.getCorners().map((point) => local.applyToPoint(point))

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

    this.targetShape.applyDeltaTransform(delta)

    this._updateHandlePositions()
  }

  private _getSkewHandlePosition() {
    const bounds = this.targetShape.getBounds({ skipTransform: true })

    return {
      bottom: () => new Point(bounds.x + bounds.width / 2, bounds.y + bounds.height),
      right: () => new Point(bounds.x + bounds.width, bounds.y + bounds.height / 2),
      left: () => new Point(bounds.x, bounds.y + bounds.height / 2),
      top: () => new Point(bounds.x + bounds.width / 2, bounds.y),
    }
  }
}