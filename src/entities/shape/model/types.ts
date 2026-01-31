import type { Rect } from "@/shared/type/shared"

export type Point = {
  x: number
  y: number
}

export type Transform = {
  rotate: number
  scaleX: number
  scaleY: number
}

export type RectangleGeometry = {
  kind: "rectangle-geometry"
  x: number
  y: number
  width: number
  height: number
}

export type EllipseGeometry = {
  kind: "ellipse-geometry"
  cx: number
  cy: number
  rx: number
  ry: number
}

export type DiamondGeometry = {
  kind: "diamond-geometry"
  cx: number
  cy: number
  width: number
  height: number
}

export type PathGeometry = {
  kind: "path-geometry"
  points: Point[]
}

export type ShapeGeometry = 
  | RectangleGeometry
  | EllipseGeometry
  | DiamondGeometry
  | PathGeometry

export type RectangleStyle = {
  borderRadius: number
  strokeColor: string
  fillColor: string
  lineWidth: number
  opacity: number
}

export type EllipseStyle = {
  strokeColor: string
  fillColor: string
  lineWidth: number
  opacity: number
}

export type PenStyle = {
  strokeColor: string
  lineWidth: number
  opacity: number
  fill: string
}

export type LineStyle = {
  strokeColor: string
  thickness: number
  opacity: number
}

export type ArrowStyle = {
  strokeColor: string
  startArrow: string
  thickness: number
  endArrow: string
  variant: string
  opacity: number
}

export type TextStyle = {
  textBaseline: string
  strokeColor: string
  fontFamily: string
  textAlign: string
  fontSize: number
  opacity: number
}

export type ImageStyle = {
  borderRadius: number
  opacity: number
}

export type ShapeKind =
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "image"
  | "arrow"
  | "line"
  | "text"
  | "pen"

export type AttachedText = {
  text?: {
    value: string
    style: TextStyle
  }
}

export type SketchData = {
  outlines: Point[][]
  layerOffsets: Point[]
  hachureLines: Point[][]
}

export type Sketchable<T extends BaseShape> =
  | (T & { sketch: false })
  | (T & { sketch: true; sketchData: SketchData })


export type BaseShape = {
  id: string
  kind: ShapeKind
  sketch: boolean
  colorId: string
  transform: Transform
}

export type RectangleShape = Sketchable<BaseShape & AttachedText & {
  kind: "rectangle"
  style: RectangleStyle
  geometry: RectangleGeometry
}>

export type EllipseShape = Sketchable<BaseShape & AttachedText & {
  kind: "ellipse"
  style: EllipseStyle
  geometry: EllipseGeometry
}>

export type DiamondShape = Sketchable<BaseShape & AttachedText & {
  kind: "diamond"
  style: RectangleStyle
  geometry: DiamondGeometry
}>

export type PenShape = BaseShape & {
  kind: "pen"
  style: PenStyle
  geometry: PathGeometry
}

export type LineShape = Sketchable<BaseShape & AttachedText & {
  kind: "line"
  style: LineStyle
  geometry: PathGeometry
}>

export type ArrowShape = Sketchable<BaseShape & AttachedText & {
  kind: "arrow"
  style: ArrowStyle
  geometry: PathGeometry
}>

export type ImageShape = BaseShape & {
  kind: "image"
  src: string
  style: ImageStyle
  geometry: RectangleGeometry
}

export type TextNode = {
  kind: "text"
  text: string
  style: TextStyle
  geometry: RectangleGeometry
}

export type Shape =
  | RectangleShape
  | EllipseShape
  | DiamondShape
  | PenShape
  | LineShape
  | ArrowShape
  | ImageShape

export type RenderMode =
  | { kind: "vector" }
  | {
    bbox: Rect
    kind: "bitmap"
    dirty: boolean
    bitmap: ImageBitmap
  }

export type ClientState = {
  isSelected: boolean
  renderMode: RenderMode
}

export type ClientShape = Shape & {
  client: ClientState
}
