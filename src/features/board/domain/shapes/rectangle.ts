import type { Point, Rect, Simplify } from "@/shared/type/shared"

export type RectangleWithoutSketch = {
  sketch: false
}

export type RectangleWithSketch = {
  sketch: true

  hachureLines: Array<Point[]>
  outlines: Array<Point[]>
  layerOffsets: Point[]
  hachureFill: boolean
  strokeColor: string
}

export type Rectangle = Rect & {
  type: "rectangle"
  colorId: string
  sketch: boolean
  id: string
}

export type RectangleToView = Simplify<Rectangle & (RectangleWithSketch | RectangleWithoutSketch)>
