import { SELECTION_BOUNDS_PADDING } from "@/entities/shape"
import type { Bound } from "@/features/board/domain/selection-area"
import type { ResizeTransformerStrategy } from "./interface-strategy"
import type { Rectangle } from "../maths/rectangle"
import type { PointData } from "../maths"
import * as Shapes from "../shapes"

export class ResizePreviewTransformerStrategy implements ResizeTransformerStrategy {
  private _scaleX: number = 1
  private _scaleY: number = 1

  private _shape!: Shapes.Polygon
  private _bounds!: Rectangle
  private _angle!: number
  private _bound!: Bound

  public start(shape: Shapes.Polygon, bound: Bound) {
    this._scaleX = 1
    this._scaleY = 1

    this._bounds = shape.getBounds
    this._angle = shape.angle
    this._bound = bound
    this._shape = shape
  }

  public resize(cursor: PointData): void {
    ({
      bottom: this._resizeFromBottomBound,
      right: this._resizeFromRightBound,
      left: this._resizeFromLeftBound,
      top: this._resizeFromTopBound,
    })[this._bound].bind(this)(cursor)
  }

  public draw(context: CanvasRenderingContext2D): void {
    const { translate, offset, center } = this._getTranslate(this._bound)

    const angle = this._angle
    const points = this._shape.points

    context.save()

    context.translate(center.x, center.y)
    context.rotate(angle)

    context.translate(translate.x, translate.y)
    context.scale(this._scaleX, this._scaleY)

    context.beginPath()

    for (let i = 0; i < points.length; i++) {
      context.lineTo(points[i].x - offset.x, points[i].y - offset.y)
    }

    context.closePath()
    context.stroke()

    context.restore()
  }

  private _getTranslate(bound: Bound) {
    const bounds = this._bounds

    return {
      center: {
        x: bounds.centerX,
        y: bounds.centerY,
      },
      translate: ({
        bottom: { x: -bounds.width / 2, y: -bounds.height / 2 },
        right: { x: -bounds.width / 2, y: -bounds.height / 2 },
        left: { x: bounds.width / 2, y: -bounds.height / 2 },
        top: { x: -bounds.width / 2, y: bounds.height / 2 },
      })[bound],
      offset: ({
        bottom: { x: bounds.x, y: bounds.y },
        right: { x: bounds.x, y: bounds.y },
        left: { x: bounds.x + bounds.width, y: bounds.y },
        top: { x: bounds.x, y: bounds.y + bounds.height },
      })[bound],
    }
  }

  private _resizeFromRightBound(cursor: PointData) {
    const bounds = this._bounds
    const angle = this._angle

    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const leftWorldX = bounds.centerX - (bounds.width / 2) * cos
    const leftWorldY = bounds.centerY - (bounds.width / 2) * sin

    const dx = cursor.x - SELECTION_BOUNDS_PADDING - leftWorldX
    const dy = cursor.y - leftWorldY

    const axisXx = cos
    const axisXy = sin

    const projection = dx * axisXx + dy * axisXy

    if (Math.abs(projection) < SELECTION_BOUNDS_PADDING * 2) {
      this._scaleX = 0.0001
      return
    }

    const newWidth = projection < 0
      ? projection + SELECTION_BOUNDS_PADDING * 2
      : projection

    this._scaleX = newWidth / bounds.width
  }

  private _resizeFromLeftBound(cursor: PointData) {
    const angle = this._angle

    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const cx = this._bounds.centerX
    const cy = this._bounds.centerY

    const rightWorldX = cx + (this._bounds.width / 2) * cos
    const rightWorldY = cy + (this._bounds.width / 2) * sin

    const dx = cursor.x - rightWorldX
    const dy = cursor.y - rightWorldY

    const axisXx = cos
    const axisXy = sin

    const projection = dx * axisXx + dy * axisXy

    const nextWidth = -projection

    if (Math.abs(nextWidth) < SELECTION_BOUNDS_PADDING * 2) {
      this._scaleX = 0.0001
      return
    }

    this._scaleX = nextWidth / this._bounds.width
  }

  private _resizeFromTopBound(cursor: PointData) {
    const bounds = this._bounds
    const angle = this._angle

    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const cx = bounds.x + bounds.width / 2
    const cy = bounds.y + bounds.height / 2

    const bottomWorldX = cx + (bounds.height / 2) * (-sin)
    const bottomWorldY = cy + (bounds.height / 2) * (cos)

    const dx = cursor.x - bottomWorldX
    const dy = cursor.y - bottomWorldY

    const axisYx = -sin
    const axisYy = cos

    const projection = dx * axisYx + dy * axisYy
    const nextHeight = -projection

    if (Math.abs(nextHeight) < SELECTION_BOUNDS_PADDING * 2) {
      this._scaleY = 0.0001
      return
    }

    this._scaleY = nextHeight / bounds.height
  }

  private _resizeFromBottomBound(cursor: PointData) {
    const bounds = this._bounds
    const angle = this._angle

    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const cx = bounds.x + bounds.width / 2
    const cy = bounds.y + bounds.height / 2

    const topWorldX = cx - (bounds.height / 2) * (-sin)
    const topWorldY = cy - (bounds.height / 2) * (cos)

    const dx = cursor.x - topWorldX
    const dy = cursor.y - topWorldY

    const axisYx = -sin
    const axisYy = cos

    const projection = dx * axisYx + dy * axisYy
    const nextHeight = projection

    if (Math.abs(nextHeight) < SELECTION_BOUNDS_PADDING * 2) {
      this._scaleY = 0.0001
      return
    }

    this._scaleY = nextHeight / bounds.height
  }
}