import { isNil, isNull } from "lodash"
import { Group } from "../../core/Group"
import { Node, routes } from "../../core/Node"
import { Matrix3x3, Point } from "../../maths"
import { type CircleConfig, CircleShape } from "../../shapes/Circle"
import { SYSTEM_UI } from "../GradientControls/BaseGradientGroup"
import { HANDLER_KEY_NAME, HANDLE_ROTATE_CORNERS, HANDLE_SKEW_EDGES } from "./Operations/_const"
import type { Corner, Edge, TransformContext, TransformOperation } from "./Operations/_operation.interface"
import { RotateOperation } from "./Operations/_rotate-operation"
import { SkewOperation } from "./Operations/_skew-operation"

const ASD_V1 = {
  handlerPositionNameList: HANDLE_SKEW_EDGES,
  config: {
    fillStyle: "#ffa500"
  }
}

const ASD_V2 = {
  handlerPositionNameList: HANDLE_ROTATE_CORNERS,
  config: {
    fillStyle: "#ff0000"
  }
}

export class RotateAndSkewTransforGroup extends Group {
  private _targetNode: Node | null = null
  private _pickedHandler: Edge | null = null
  private _activeOperation: TransformOperation | null = null

  public get pickedHandler() {
    if (isNil(this._pickedHandler)) throw new Error("Not exist picked handler")
    return this._pickedHandler
  }

  public get targetNode(): Node {
    if (isNil(this._targetNode)) throw new Error("Child not found")
    return this._targetNode
  }

  public get handlers() {
    return this.children.filter((child) => child.hasName(SYSTEM_UI))
  }

  public constructor() {
    super()
    this.addName(SYSTEM_UI)

    this.handleAddChild = this.handleAddChild.bind(this)
    this.emitter.on(routes.addChild, this.handleAddChild)
  }

  public render(context: CanvasRenderingContext2D): void {
    const node = this._targetNode
    if (isNull(node)) return

    const currentMatrix = Matrix3x3.compose(node.cachedMatrix, node.worldMatrix)
    const corners = node
      .getBounds({ skipTransform: true })
      .getCorners()
      .map((p) => currentMatrix.applyToPoint(p))

    context.betweenSaveAndRestore(() => {
      context.strokeStyle = "#2980e6"
      context.beginPath()
      context.moveTo(corners[0].x, corners[0].y)
      corners.forEach((p) => context.lineTo(p.x, p.y))
      context.closePath()
      context.stroke()
    })

    super.render(context)
  }

  private _reset() {
    this._activeOperation = null
    this._pickedHandler = null
    this._targetNode = null

    this.handlers.forEach((handler) => handler.destroy())
  }

  private handleRemoveChild({ payload }: ReturnType<typeof routes.removeChild>) {
    if (!payload.child.hasName(SYSTEM_UI) && payload.child === this._targetNode) {
      this.emitter.off(routes.removeChild, this.handleRemoveChild)
      this._reset()
    }
  }

  private handleAddChild({ payload }: ReturnType<typeof routes.addChild>) {
    const addedNode = payload.child
    if (addedNode.hasName(SYSTEM_UI)) return

    this._targetNode = addedNode
    this.handlers.forEach((handler) => handler.destroy())

    this._createHandlers(ASD_V1)
    this._createHandlers(ASD_V2)

    this.handleRemoveChild = this.handleRemoveChild.bind(this)
    this.emitter.on(routes.removeChild, this.handleRemoveChild)
  }

  private _createHandlers({ config, handlerPositionNameList }: {
    handlerPositionNameList: Array<Edge | Corner>
    config: Partial<CircleConfig>
  }) {
    const handlePositions = this._getHandlePositions()
    const addedShape = this.targetNode

    handlerPositionNameList.forEach((handlerName) => {
      const handler = new CircleShape({
        strokeStyle: "#e2e2e2",
        fillStyle: "#ffa500",
        names: [SYSTEM_UI],
        radius: 6,
        x: 0,
        y: 0,

        ...config,
      })

      handler.position = addedShape.worldMatrix.applyToPoint(handlePositions[handlerName]())
      handler.setDataAttr(HANDLER_KEY_NAME, handlerName)
      handler.addName(SYSTEM_UI)

      this._attachDragEventsToRotateHandlers(handler)
      this.appendChild(handler)
    })
  }

  private _getHandlersWithout(handler: Node) {
    const handlers = this.handlers
    const foundIndex = handlers.indexOf(handler)
    if (foundIndex === -1) return handlers
    const prev = handlers.slice(0, foundIndex)
    const next = handlers.slice(foundIndex + 1)
    return prev.concat(next)
  }

  private _updateHandlePositions() {
    const targetNode = this.targetNode

    this.handlers.forEach((handler) => {
      const draggable = handler.draggable
      const nextPosition = draggable.startPosition.sub(draggable.startOffset)
      targetNode.cachedMatrix.applyToPoint(nextPosition).copyTo(nextPosition)

      handler.position = nextPosition
    })
  }

  public createContext(): TransformContext {
    return {
      target: this.targetNode,
      pickedHandler: this.pickedHandler,
      updateHandlePositions: this._updateHandlePositions.bind(this)
    }
  }

  public getOperation(handler: Node) {
    const handleName = handler.getDataAttr<any>(HANDLER_KEY_NAME)
    if (HANDLE_SKEW_EDGES.includes(handleName)) return new SkewOperation()
    if (HANDLE_ROTATE_CORNERS.includes(handleName)) return new RotateOperation()
    return null
  }

  private _attachDragEventsToRotateHandlers(handler: Node) {
    handler.emitter.on(routes.startDrag, this._startDrag.bind(this))
    handler.emitter.on(routes.finishDrag, this._finishDrag.bind(this))
    handler.emitter.on(routes.processDrag, this._processDrag.bind(this))
  }

  private _processDrag(_event: ReturnType<typeof routes.processDrag>) {
    this._activeOperation?.process(this.createContext())
  }

  private _startDrag({ payload }: ReturnType<typeof routes.startDrag>) {
    this._pickedHandler = payload.target.getDataAttr<Edge>(HANDLER_KEY_NAME)

    this._activeOperation = this.getOperation(payload.target)
    this._activeOperation?.start(this.createContext())

    this
      ._getHandlersWithout(payload.target)
      .forEach((shape) => shape.draggable.startDrag())
  }

  private _finishDrag({ payload }: ReturnType<typeof routes.finishDrag>) {
    this._activeOperation?.finish(this.createContext())

    this
      ._getHandlersWithout(payload.target)
      .forEach((shape) => shape.draggable.finishDrag())
  }

  private _getHandlePositions() {
    const bounds = this.targetNode.getBounds({ skipTransform: true })

    return {
      bottom: () => new Point(bounds.x + bounds.width / 2, bounds.y + bounds.height),
      right: () => new Point(bounds.x + bounds.width, bounds.y + bounds.height / 2),
      left: () => new Point(bounds.x, bounds.y + bounds.height / 2),
      top: () => new Point(bounds.x + bounds.width / 2, bounds.y),

      bottomRight: () => new Point(bounds.x + bounds.width, bounds.y + bounds.height),
      bottomLeft: () => new Point(bounds.x, bounds.y + bounds.height),

      topRight: () => new Point(bounds.x + bounds.width, bounds.y),
      topLeft: () => new Point(bounds.x, bounds.y),
    }
  }
}