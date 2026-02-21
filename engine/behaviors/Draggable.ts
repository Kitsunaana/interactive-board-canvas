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
      const parent = node.parent()

      const currentPointer = parent ? parent.getRelativePointerPosition() : node.absolutePositionCursor
      const delta = subtractPoint(this._startDragPointer, currentPointer)
      const newPosition = addPoint(this._startDragPosition, delta)

      const position = node.position()

      position.x = newPosition.x
      position.y = newPosition.y
    }
  }

  private _startDrag(node: Node) {
    const parent = node.parent()

    this._startDragPointer = parent
      ? parent.getRelativePointerPosition()
      : {
        x: node.absolutePositionCursor.x,
        y: node.absolutePositionCursor.y,
      }

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
    const pointer = node.getRelativePointerPosition()

    if (node.getName() === "group1") {
      console.log(node.getAbsolutePosition(), node.absolutePositionCursor)
      console.log(JSON.stringify(node.getClientRect(), null, 2))
      console.log(pointer)
    }

    return node.contains(pointer)
    // return node.contains({
    //   x: pointer.x + node.position().x,
    //   y: pointer.y + node.position().y,
    // })
  }
}