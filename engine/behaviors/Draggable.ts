import { clone, isNull } from "lodash"
import { Node } from "../Node"
import * as Primitive from "../maths"
import { EventsMoveFlow } from "../shared/drag-events-flow"
import { addPoint, subtractPoint } from "../shared/point"

export class Draggable extends EventsMoveFlow {
  private _startPosition: Primitive.PointData | null = null
  private _startCursor: Primitive.PointData | null = null

  private _isDragging: boolean = false

  public constructor(private readonly node: Node) {
    super()
  }

  public isDragging() {
    return this._isDragging
  }

  public startDrag() {
    this._isDragging = true
  }

  public stopDrag() {
    this._isDragging = false
  }

  public commit(_event: PointerEvent) {
    this._startCursor = null
    this._startPosition = null

    this.stopDrag()
  }

  public process(_event: PointerEvent) {
    if (this.isDragging() && !isNull(this._startCursor) && !isNull(this._startPosition)) {
      const delta = subtractPoint(this._startCursor, this._getCurrentPointer())
      const next = addPoint(this._startPosition, delta)

      this.node.position(next)
    }
  }

  public start(_event: PointerEvent) {
    const node = this.node

    if (this.canStart(_event) && node.isDraggable()) {
      this._startCursor = this._getCurrentPointer()
      this._startPosition = node.position().clone()

      node
        .getAllParents()
        .forEach((parent) => parent.drag.stopDrag())

      this.startDrag()
    }
  }

  public canStart(_event: PointerEvent) {
    return this.node.contains(this.node.getRelativePointerPosition())
  }

  private _getCurrentPointer() {
    const parent = this.node.parent()

    return parent
      ? parent.getRelativePointerPosition()
      : clone(this.node.absolutePositionCursor)
  }
}
