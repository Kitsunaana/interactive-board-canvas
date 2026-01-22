import type { SketchShapeProperties } from "@/shared/lib/sketch"
import type { Point, Rect, Simplify } from "@/shared/type/shared"

export type BaseShapeProperties = {
  colorId: string
  sketch: boolean
  id: string
}

/**
 * Circle
 */
export type CircleWithoutSketch = { sketch: false }
export type CircleWithSketch = SketchShapeProperties & { sketch: true }
export type Circle = Rect & BaseShapeProperties & { type: "circle" }
export type CircleToView = Simplify<Circle & (CircleWithSketch | CircleWithoutSketch)>

/**
 * Rectangle
 */
export type RectangleWithoutSketch = { sketch: false }
export type RectangleWithSketch = SketchShapeProperties & { sketch: true }
export type Rectangle = Rect & BaseShapeProperties & { type: "rectangle" }
export type RectangleToView = Simplify<Rectangle & (RectangleWithSketch | RectangleWithoutSketch)>

/**
 * Square
 */
export type Square = Rect & BaseShapeProperties & { type: 'square' }

export type SquareToView = Square

export type Arrow = Rect & {
  type: "arrow"

  id: string
  colorId: string
  sketch: boolean

  start: Point
  end: Point
}

export type ArrowToView = Arrow

export type Shape =
  | Rectangle
  | Square
  | Circle
  | Arrow

export type ShapeToView =
  (
    | RectangleToView
    | SquareToView
    | CircleToView
    | ArrowToView
  )

export type ShapeToRender =
  (
    | RectangleToView
    | SquareToView
    | CircleToView
    | ArrowToView
  ) & {
    isSelected?: boolean

    onMouseDown?: (event: PointerEvent) => void
    onMouseMove?: (event: PointerEvent) => void
    onMouseUp?: (event: PointerEvent) => void
  }
