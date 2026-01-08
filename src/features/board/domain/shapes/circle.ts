import type { Point, Rect, Simplify } from "@/shared/type/shared"

export type CircleWithoutSketch = {
  sketch: false
}

export type CircleWithSketch = {
  sketch: true

  hachureLines: Array<Point[]>
  outlines: Array<Point[]>
  layerOffsets: Point[]
  hachureFill: boolean
  strokeColor: string
}

export type Circle = Rect & {
  type: "circle"

  colorId: string
  sketch: boolean
  id: string
}

export type CircleToView = Simplify<Circle & (CircleWithSketch | CircleWithoutSketch)>
