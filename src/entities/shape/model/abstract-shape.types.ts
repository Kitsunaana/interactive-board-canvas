import type { Point, Simplify } from "@/shared/type/shared"

export type ShapeKind =
  | "shape"
  | "text"
  | "image"
  | "pen"
  | "arrow"
  | "line"

export type Shape<G extends Geometry = Geometry, S extends Style = Style> = {
  id: string
  style: S
  geometry: G
  kind: ShapeKind
  colorId: string
  transform: Transform
}

export type Sketchable<S extends Shape> = Simplify<S & (
  | { sketch: false }
  | {
    sketch: true
    hachureLines: Array<Point[]>
    outlines: Array<Point[]>
    layerOffsets: Point[]
  }
)>

export type Transform = {
  rotate: number
}

export type Style =
  | EllipseStyle
  | ArrowStyle
  | ImageStyle
  | RectStyle
  | TextStyle
  | LineStyle
  | PenStyle

export type ImageStyle = {
  borderRadius: number
  opacity: number
}

export type PenStyle = {
  strokeColor: string
  lineWidth: number
  opacity: number
}

export type LineStyle = {
  breakPolygon: boolean
  strokeColor: string
  fillColor: string
  thickness: number
  opacity: number
  edges: string
} 

export type ArrowStyle = {
  strokeColor: string
  startArrow: string
  thickness: number
  endArrow: string
  variant: string
  opacity: number
}

export type EllipseStyle = {
  strokeColor: string
  fillColor: string
  lineWidth: number
  opacity: number
  border: string
}

export type RectStyle = {
  borderRadius: number
  strokeColor: string
  fillColor: string
  lineWidth: number
  opacity: number
  border: string
}

export type TextStyle = {
  textBaseline: string
  strokeColor: string
  fontFamily: string
  textAlign: string
  fontSize: number
  opacity: number
}

export type Geometry =
  | RectGeometry
  | PathGeometry

export type RectGeometry = {
  type: "rect"
  x: number
  y: number
  width: number
  height: number
}

export type PathGeometry = {
  type: "path"
  points: Point[]
}