import type { Point, Rect, Simplify } from "@/shared/type/shared"

export type SketchShapeProperties = {
  hachureLines: Array<Point[]>
  outlines: Array<Point[]>
  layerOffsets: Point[]
  hachureFill: boolean
  strokeColor: string
}

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

  colorId: string
  sketch: boolean
  id: string
  start: {
    x: number
    y: number
  }
  end: {
    x: number
    y: number
  }
}

export type ArrowToView = Arrow

export type Shape =
  | Rectangle
  | Square
  | Circle
  | Arrow


export type ShapeToView = Simplify<
  (
    | RectangleToView
    | SquareToView
    | CircleToView
    | ArrowToView
  ) & {
    isSelected?: boolean
  }
>