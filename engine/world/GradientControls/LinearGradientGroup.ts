import { isNil } from "lodash";
import { Point, Rectangle } from "../../maths";
import { CircleShape } from "../../shapes/Circle";
import { getAbsolutePosition, getNormalizedPosition } from "../../shared/point";
import { BaseGradientGroup, getRandomColor, RADIUS, SYSTEM_UI } from "./BaseGradientGroup";
import { LinearGradientData, RadialGradientData } from "../GradientData";
import { Shape } from "../../core/Shape";
import { routes } from "../../core/Node";

export class LinearGradientGroup extends BaseGradientGroup {
  public constructor() {
    super()

    this.attachHandleDragEvents(this.startHandle)
    this.attachHandleDragEvents(this.endHandle)

    this.connectionLine.events.on("dblclick", this.handleConnectionLineDoubleClick.bind(this))
    this.emitter.on(routes.addChild, this.onTargetShapeAdded.bind(this))
  }

  public onTargetShapeAdded({ payload }: ReturnType<typeof routes.addChild>): void {
    const addedChild = payload.child

    if (addedChild.hasName(SYSTEM_UI) || !(addedChild instanceof Shape)) return

    const isLinearGradient = addedChild.gradient instanceof RadialGradientData
    if (isNil(addedChild.gradient) || isLinearGradient) this.initializeDefaultGradient(addedChild)
    else this.syncHandlesWithExistingGradient(addedChild)

    this.connectionLine.setPoints(this.calculateConnectionLineVertices())
    this.appendChild(this.connectionLine, this.startHandle, this.endHandle)
  }

  public attachHandleDragEvents(handle: CircleShape): CircleShape {
    handle.emitter.on(handle.draggable.routes.processDrag, () => {
      handle.position = handle.draggable.nextPosition

      this.connectionLine.setPoints(this.calculateConnectionLineVertices())
      this.updateStepHandlesPositions()

      const gradientData = this.targetShape.gradient!
      const relativePosition = getNormalizedPosition(handle.position, this.targetShape.getBounds({}))

      const targetRelativePosition = this.startHandle === handle
        ? gradientData.startRelativePosition
        : gradientData.endRelativePosition

      targetRelativePosition.copyFrom(relativePosition)
    })

    return handle
  }

  public syncHandlesWithExistingGradient(targetShape: Shape): void {
    const gradientData = targetShape.gradient! as LinearGradientData
    const colorStops = gradientData.steps

    const startColor = colorStops[0][1]
    const endColor = colorStops[colorStops.length - 1][1]

    this.startHandle.setDataAttr("color", startColor)
    this.endHandle.setDataAttr("color", endColor)

    const targetBounds = targetShape.getBounds({})

    const startPos = getAbsolutePosition(gradientData.startRelativePosition, targetBounds)
    const endPos = getAbsolutePosition(gradientData.endRelativePosition, targetBounds)

    this.startHandle.position = startPos
    this.endHandle.position = endPos
  }

  public initializeDefaultGradient(targetShape: Shape): void {
    this.startHandle.setDataAttr("color", getRandomColor())
    this.endHandle.setDataAttr("color", getRandomColor())

    const targetBounds = targetShape.getBounds({})
    const [startPos, endPos] = this.calculateDefaultHandlePositions(targetBounds)

    this.startHandle.position = startPos
    this.endHandle.position = endPos

    targetShape.gradient = new LinearGradientData(
      getNormalizedPosition(this.startHandle, targetBounds),
      getNormalizedPosition(this.endHandle, targetBounds),
      this.extractColorStops()
    )
  }

  public calculateDefaultHandlePositions(bounds: Rectangle): [Point, Point] {
    const start = new Point(bounds.x + bounds.width / 2 - RADIUS, bounds.y)
    const end = new Point(bounds.x + bounds.width / 2 - RADIUS, bounds.y + bounds.height - RADIUS * 2)

    return [start, end]
  }
}