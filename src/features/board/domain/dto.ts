import type { Rect, Simplify } from "@/shared/type/shared"
import type { Rectangle, RectangleToView } from "./shapes/rectangle"

export type Square = Rect & {
  type: 'square'

  colorId: string
  sketch: boolean
  id: string
}

export type SquareToView = Square

export type Circle = Rect & {
  type: "circle"

  colorId: string
  sketch: boolean
  id: string
}

export type CircleToView = Circle

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