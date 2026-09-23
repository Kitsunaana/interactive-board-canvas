import { isNil } from "lodash";
import { Matrix3x3, Point } from "../../maths";
import { CircleShape } from "../../shapes/Circle";
import { BaseGradientGroup, RADIUS, SYSTEM_UI, getRandomColor } from "./BaseGradientGroup";
import { angleBetweenPoints, getAbsolutePosition, getNormalizedPosition } from "../../shared/point";
import { LinearGradientData, RadialGradientData } from "../GradientData";
import { Shape } from "../../core/Shape";
import { routes } from "../../core/Node";

export class RadialGradientGroup extends BaseGradientGroup {
  public readonly radiusHandle = this.createHandle()

  private readonly centerDragStartState = {
    radiusHandle: this.radiusHandle.position,
    endHandle: this.endHandle.position,
  }

  private readonly orbitalDragState = {
    initRadiusPosition: Point.zero(),
    initAngle: 0,
  }

  public constructor() {
    super()

    this.radiusHandle.setDataAttr("color", "#05a6e6")

    this.attachOrbitalDragStart(this.radiusHandle, this.endHandle)
    this.attachOrbitalDragStart(this.endHandle, this.radiusHandle)

    this.attachOrbitalDragProcess(this.radiusHandle, this.endHandle)
    this.attachOrbitalDragProcess(this.endHandle, this.radiusHandle)

    this.attachCenterHandleDragStart()
    this.attachCenterHandleDragProcess()

    this.connectionLine.events.on("dblclick", this.handleConnectionLineDoubleClick.bind(this))
    this.emitter.on(routes.addChild, (this.onTargetShapeAdded.bind(this)))
  }

  public onTargetShapeAdded({ payload }: ReturnType<typeof routes.addChild>): void {
    const addedChild = payload.child
    if (addedChild.hasName(SYSTEM_UI) || !(addedChild instanceof Shape)) return

    const isLinearGradient = addedChild.gradient instanceof LinearGradientData
    if (isNil(addedChild.gradient) || isLinearGradient) this.initializeDefaultGradient(addedChild)
    else this.syncHandlesWithExistingGradient(addedChild)

    this.connectionLine.setPoints(this.calculateConnectionLineVertices())

    this.appendChild(this.connectionLine, this.startHandle, this.endHandle, this.radiusHandle)
  }

  public syncHandlesWithExistingGradient(targetShape: Shape): void {
    const gradientData = targetShape.gradient! as unknown as RadialGradientData
    const colorStops = gradientData.steps

    const startColor = colorStops[0][1]
    const endColor = colorStops[colorStops.length - 1][1]

    this.startHandle.setDataAttr("color", startColor)
    this.endHandle.setDataAttr("color", endColor)

    const bounds = targetShape.getBounds({})

    const radiusPos = getAbsolutePosition(gradientData.radiusRelativePosition, bounds)
    const startPos = getAbsolutePosition(gradientData.startRelativePosition, bounds)
    const endPos = getAbsolutePosition(gradientData.endRelativePosition, bounds)

    this.radiusHandle.position = radiusPos
    this.startHandle.position = startPos
    this.endHandle.position = endPos
  }

  public initializeDefaultGradient(addedChild: Shape): void {
    const bounds = addedChild.getBounds({})

    this.startHandle.position = bounds.center

    this.endHandle.position = new Point(bounds.x + bounds.width - RADIUS, bounds.center.y)
    this.radiusHandle.position = new Point(bounds.center.x, bounds.y - RADIUS)

    this.startHandle.setDataAttr("color", getRandomColor())
    this.endHandle.setDataAttr("color", getRandomColor())

    const xRadius = this.endHandle.position.sub(this.startHandle).length()
    const yRadius = this.radiusHandle.position.sub(this.startHandle).length()

    addedChild.gradient = new RadialGradientData(
      getNormalizedPosition(this.startHandle.position, bounds),
      getNormalizedPosition(this.endHandle.position, bounds),
      getNormalizedPosition(this.radiusHandle.position, bounds),
      getNormalizedPosition({ x: xRadius, y: yRadius }, bounds),
      this.extractColorStops()
    )
  }

  public attachCenterHandleDragStart(): void {
    this.startHandle.emitter.on(this.startHandle.draggable.routes.startDrag, () => {
      this.centerDragStartState.radiusHandle = this.radiusHandle.position
      this.centerDragStartState.endHandle = this.endHandle.position
    })
  }

  public attachCenterHandleDragProcess(): void {
    this.startHandle.emitter.on(this.startHandle.draggable.routes.processDrag, () => {
      this.startHandle.position = this.startHandle.draggable.nextPosition

      const targetBounds = this.targetShape.getBounds({})

      const dragDelta = this.startHandle.draggable.delta
      const relativeDragDelta = this.startHandle.draggable.deltaBetweenStartAndObjectPositions

      this.endHandle.position = this.centerDragStartState.endHandle.add(dragDelta).add(relativeDragDelta)
      this.radiusHandle.position = this.centerDragStartState.radiusHandle.add(dragDelta).add(relativeDragDelta)

      this.connectionLine.setPoints(this.calculateConnectionLineVertices())
      this.updateStepHandlesPositions()

      const gradientData = this.targetShape.gradient! as RadialGradientData

      gradientData.startRelativePosition = getNormalizedPosition(this.startHandle.position, targetBounds)
      gradientData.endRelativePosition = getNormalizedPosition(this.endHandle.position, targetBounds)
    })
  }

  public attachOrbitalDragStart(handle: CircleShape, opposite: CircleShape) {
    handle.emitter.on(handle.draggable.routes.startDrag, () => {
      this.orbitalDragState.initAngle = angleBetweenPoints(this.startHandle.position, handle.position)
      this.orbitalDragState.initRadiusPosition = opposite.position
    })
  }

  public attachOrbitalDragProcess(handle: CircleShape, opposite: CircleShape) {
    handle.emitter.on(handle.draggable.routes.processDrag, () => {
      handle.position = handle.draggable.nextPosition

      const targetBounds = this.targetShape.getBounds({})

      const currentAngle = angleBetweenPoints(this.startHandle.position, handle.position)
      const deltaAngle = currentAngle - this.orbitalDragState.initAngle

      const rotationMatrix = Matrix3x3.aroundOrigin(this.startHandle.position, () => Matrix3x3.rotate(deltaAngle))

      const nextPos = rotationMatrix.applyToPoint(this.orbitalDragState.initRadiusPosition)
      opposite.position = nextPos

      const gradientData = this.targetShape.gradient as RadialGradientData

      gradientData.radiusRelativePosition = getNormalizedPosition(this.radiusHandle, targetBounds)
      gradientData.startRelativePosition = getNormalizedPosition(this.startHandle, targetBounds)
      gradientData.endRelativePosition = getNormalizedPosition(this.endHandle, targetBounds)

      const xRadius = this.endHandle.position.sub(this.startHandle.position).length()
      const yRadius = this.radiusHandle.position.sub(this.startHandle.position).length()

      gradientData.radiusLength = getNormalizedPosition({ x: xRadius, y: yRadius }, targetBounds)

      this.connectionLine.setPoints(this.calculateConnectionLineVertices())
      this.updateStepHandlesPositions()
    })
  }

  public render(context: CanvasRenderingContext2D): void {
    const targetShapeIndex = this.children.indexOf(this.targetShape)
    if (targetShapeIndex === -1) return super.render(context)

    this.targetShape.render(context)

    context.betweenSaveAndRestore(() => {
      context.beginPath()
      context.moveTo(this.startHandle.x + RADIUS, this.startHandle.y + RADIUS)
      context.lineTo(this.radiusHandle.x + RADIUS, this.radiusHandle.y + RADIUS)
      context.setLineDash([7, 3])
      context.strokeStyle = "#2e66f9"
      context.lineWidth = 2
      context.stroke()
    })

    this.children.forEach((child, index) => {
      if (targetShapeIndex === index) return
      child.render(context)
    })
  }
}