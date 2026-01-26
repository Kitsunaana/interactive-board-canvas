import * as ShapeDomain from "./abstract-shape.types"

export type Rectangle = ShapeDomain.Sketchable<ShapeDomain.Shape<ShapeDomain.RectGeometry, ShapeDomain.RectStyle>>

export type Rhombus = ShapeDomain.Sketchable<ShapeDomain.Shape<ShapeDomain.RectGeometry, ShapeDomain.RectStyle>>

export type Ellipse = ShapeDomain.Sketchable<ShapeDomain.Shape<ShapeDomain.RectGeometry, ShapeDomain.EllipseStyle>>

export type Arrow = ShapeDomain.Shape<ShapeDomain.PathGeometry, ShapeDomain.ArrowStyle>

export type Line = ShapeDomain.Shape<ShapeDomain.PathGeometry, ShapeDomain.LineStyle>

export type Pen = ShapeDomain.Shape<ShapeDomain.PathGeometry, ShapeDomain.PenStyle>

export type Text = ShapeDomain.Shape<ShapeDomain.RectGeometry, ShapeDomain.TextStyle>

export type Image = ShapeDomain.Shape<ShapeDomain.RectGeometry, ShapeDomain.RectStyle>

export type CanvasShape = 
  | Rectangle
  | Rhombus
  | Ellipse
  | Arrow
  | Line
  | Pen
