import { clone, isNull } from "lodash"
import { Node } from "../Node"
import * as Primitive from "../maths"
import { Observer } from "../shared/Observer"
import { createDragEventsFlow } from "../shared/drag-events-flow"
import { addPoint, subtractPoint } from "../shared/point"

export abstract class Draggable extends Observer {
  private _startDragPosition: Primitive.PointData | null = null
  private _startDragPointer: Primitive.PointData | null = null

  private _isDragging: boolean = false

  public isDragging() {
    return this._isDragging
  }

  public startDrag() {
    this._isDragging = true
  }

  public stopDrag() {
    this._isDragging = false
  }

  public init(node: Node) {
    createDragEventsFlow({
      process: this._processDrag.bind(this, node),
      guard: this._canStartDrag.bind(this, node),
      start: this._startDrag.bind(this, node),

      finish: this._finishDrag.bind(this),
    })
  }

  private _finishDrag() {
    this._startDragPointer = null
    this._startDragPosition = null

    this.stopDrag()
    this.notify()
  }

  private _processDrag(node: Node) {
    if (this.isDragging() && !isNull(this._startDragPointer) && !isNull(this._startDragPosition)) {
      const offset = subtractPoint(this._startDragPointer, node.absolutePositionCursor)
      const newPosition = addPoint(this._startDragPosition, offset)
      const position = node.position()

      position.x = newPosition.x
      position.y = newPosition.y
    }
  }

  private _startDrag(node: Node) {
    this._startDragPointer = clone(node.absolutePositionCursor)
    this._startDragPosition = {
      x: node.position().x,
      y: node.position().y,
    }

    node
      .getAllParents()
      .forEach((parent) => parent.stopDrag())

    this.startDrag()
    this.notify()
  }

  private _canStartDrag(node: Node) {
    const absolutePosition = node.getAbsolutePosition()

    const positionWithoutOwnShift = subtractPoint(node.position(), absolutePosition)
    const cursorPositionInClientRect = subtractPoint(positionWithoutOwnShift, node.absolutePositionCursor)

    return node.contains(cursorPositionInClientRect)
  }
}