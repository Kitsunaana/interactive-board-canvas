import { match } from "@/shared/lib/match"
import type { CanvasShape, Ellipse, Rectangle } from "../../model/shape.types"

export const drawHelperEllipse = (context: CanvasRenderingContext2D, ellipse: Ellipse) => {
  const radiusX = ellipse.geometry.width / 2
  const radiusY = ellipse.geometry.height / 2

  context.save()

  context.beginPath()
  context.ellipse(ellipse.geometry.x + radiusX, ellipse.geometry.y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2)
  context.fillStyle = ellipse.colorId
  context.fill()

  context.restore()
}

export const drawHelperRectangle = (context: CanvasRenderingContext2D, rectangle: Rectangle) => {
  context.save()
  context.beginPath()
  context.fillStyle = rectangle.colorId
  context.rect(rectangle.geometry.x, rectangle.geometry.y, rectangle.geometry.width, rectangle.geometry.height)
  context.fill()
  context.restore()
}

export const drawHelperShape = (context: CanvasRenderingContext2D, shape: CanvasShape) => {
  return match(shape, {
    ellipse: (ellipse) => drawHelperEllipse(context, ellipse),
    rectangle: (rectangle) => drawHelperRectangle(context, rectangle),

    rhombus: () => () => {},
    arrow: () => () => {},
    line: () => () => {},
    pen: () => () => {},
  })
}