import { clone, isNull } from "lodash"
import { Node } from "../Node"
import * as Maths from "../maths"
import { Observer } from "../shared/Observer"
import { createDragEventsFlow } from "../shared/drag-events-flow"
import { addPoint, subtractPoint } from "../shared/point"

export abstract class Draggable extends Observer {
  private _startDragPosition: Maths.PointData | null = null
  private _startDragPointer: Maths.PointData | null = null

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
      guard: this._canStartDrag.bind(this, node),

      process: this._processDrag.bind(this, node),
      finish: this._finishDrag.bind(this),
      start: this._startDrag.bind(this, node),
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

      node._position = addPoint(this._startDragPosition, offset)
    }
  }

  private _startDrag(node: Node) {
    this._startDragPointer = clone(node.absolutePositionCursor)
    this._startDragPosition = clone(node._position)

    node
      .getAllParents()
      .forEach((parent) => parent.stopDrag())

    this.startDrag()
    this.notify()
  }

  private _canStartDrag(node: Node) {
    const absolutePosition = node.getAbsolutePosition()

    const positionWithoutOwnShift = subtractPoint(node._position, absolutePosition)
    const cursorPositionInClientRect = subtractPoint(positionWithoutOwnShift, node.absolutePositionCursor)

    return node.contains(cursorPositionInClientRect)
  }
}