import {SELECTION_BOUNDS_PADDING} from "@/entities/shape";
import type {Bound} from "@/features/board/domain/selection-area";
import type {ResizeTransformerStrategy} from "./interface-strategy";
import * as Shapes from "../shapes"
import * as Maths from "../math"

export class ResizeCommitTransformerStrategy implements ResizeTransformerStrategy {
  private _shape!: Shapes.Polygon
  private _bounds!: Maths.Rectangle
  private _angle!: number
  private _bound!: Bound

  public start(shape: Shapes.Polygon, bound: Bound) {
    this._bounds = shape.getBounds
    this._angle = shape.angle
    this._bound = bound
    this._shape = shape
  }

  public draw(_context: CanvasRenderingContext2D): void {
    throw new Error("draw method is not implemented")
  }

  public resize(cursor: Maths.PointData): void {
    this._resizeFromRightBound(cursor)
  }

  private _resizeFromRightBound(cursor: Maths.PointData) {
    const angle = this._angle

    const centerX = this._bounds.x + this._bounds.width / 2
    const centerY = this._bounds.y + this._bounds.height / 2

    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const leftX = centerX - (this._bounds.width / 2) * cos
    const leftY = centerY - (this._bounds.width / 2) * sin

    const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
    const correctedCursorY = cursor.y

    const toCursorX = correctedCursorX - leftX
    const toCursorY = correctedCursorY - leftY

    const axisX = {x: cos, y: sin}

    const dot = toCursorX * axisX.x + toCursorY * axisX.y
    const axisLength = Math.sqrt(axisX.x * axisX.x + axisX.y * axisX.y)
    const projection = dot / axisLength

    const nextWidth = projection

    if (nextWidth > 0) {
      const nextCenterX = leftX + (nextWidth / 2) * axisX.x
      const nextCenterY = leftY + (nextWidth / 2) * axisX.y

      const nextX = nextCenterX - (nextWidth / 2)
      const nextY = nextCenterY - (this._bounds.height / 2)

      const scaleX = nextWidth / this._bounds.width

      this._shape.points.forEach((point) => {
        point.x = nextX + (point.x - this._bounds.x) * scaleX
        point.y = nextY + (point.y - this._bounds.y)
      })

      return
    }

    const delta = leftX - correctedCursorX

    if (delta <= SELECTION_BOUNDS_PADDING * 2) {
      const nextX = leftX
      const nextY = leftY - (this._bounds.height / 2)

      this._shape.points.forEach((point) => {
        point.x = nextX + (point.x - this._bounds.x) * 0
        point.y = nextY + (point.y - this._bounds.y)
      })

      return
    }

    const flipWidth = delta - SELECTION_BOUNDS_PADDING * 2

    const nextLeftX = leftX - axisX.x * flipWidth
    const nextLeftY = leftY - axisX.y * flipWidth

    const nextCenterX = (nextLeftX + leftX) / 2
    const nextCenterY = (nextLeftY + leftY) / 2

    const nextX = nextCenterX - (flipWidth / 2)
    const nextY = nextCenterY - (this._bounds.height / 2)

    const scaleX = flipWidth / this._bounds.width

    this._shape.points.forEach((point) => {
      const localX = point.x - this._bounds.x
      const flippedLocalX = this._bounds.width - localX
      const scaledLocalX = flippedLocalX * scaleX

      point.x = nextX + scaledLocalX
      point.y = nextY + (point.y - this._bounds.y)
    })

    return
  }
}