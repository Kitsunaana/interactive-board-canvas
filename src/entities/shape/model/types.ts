import type { Point, Rect, Simplify } from "@/shared/type/shared"

type WithId<Shape> = Simplify<Shape & {
  id: string
  colorId: string
}>

type WithStyles<Shape> = Simplify<Shape & {
  opacity: number
  fillColor: string
  strokeColor: string
}>

export type WithSketch<Shape> = Simplify<Shape & (
  | { sketch: false }
  | {
    sketch: true
    hachureLines: Array<Point[]>
    outlines: Array<Point[]>
    layerOffsets: Point[]
  }
)>

export type Rectangle = WithId<WithStyles<{
  type: "rectangle"
  x: number
  y: number
  angle: number
  width: number
  height: number
  sketch: boolean
  borderRadius: number
}>>

export type Rhombus = WithId<WithStyles<{
  type: "rhombus"
  x: number
  y: number
  id: string
  angle: number
  width: number
  height: number
  sketch: boolean
  borderRadius: number
}>>

export type Ellipse = WithId<WithStyles<{
  type: "ellipse"
  x: number
  y: number
  angle: number
  width: number
  height: number
  sketch: boolean
}>>

export type Arrow = WithId<{
  type: "arrow"
  points: Point[]
  sketch: boolean
  variant: "curved" | "straight"
}>

export type Line = WithId<{
  type: "line"
  points: Point[]
  sketch: boolean
  variant: "curved" | "straight"
}>

export type Path = WithId<{
  type: "path"
  opacity: number
  points: Point[]
  thickness: number
  strokeColor: string
}>

export type Text = WithId<{
  type: "text"
  x: number
  y: number
  angle: number
  opacity: number
  fontSize: number
  parentId: string
}>

export type Image = WithId<{
  type: "image"
  x: number
  y: number
  angle: number
  width: number
  height: number
  opacity: number
  borderRadius: number
}>

export type ShapeToView = (
  | WithSketch<Rectangle>
  | WithSketch<Ellipse>
  | WithSketch<Rhombus>
  // | Arrow
  // | Line
  // | Path
  // | Text
  // | Image
)

export type Shape =
  | Rectangle
  | Rhombus
  | Ellipse
  // | Arrow
  // | Line
  // | Path
  // | Text
  // | Image