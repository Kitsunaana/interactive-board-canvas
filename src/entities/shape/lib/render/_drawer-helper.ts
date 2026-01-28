import { match } from "@/shared/lib/match"
import type { ClientShape, EllipseShape, RectangleShape } from "../../model/types"

export const drawHelperEllipse = (_context: CanvasRenderingContext2D, _ellipse: EllipseShape) => {
  // const radiusX = ellipse.geometry.width / 2
  // const radiusY = ellipse.geometry.height / 2

  // context.save()

  // context.beginPath()
  // context.ellipse(ellipse.geometry.x + radiusX, ellipse.geometry.y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2)
  // context.fillStyle = ellipse.colorId
  // context.fill()

  // context.restore()
}

export const drawHelperRectangle = (_context: CanvasRenderingContext2D, _rectangle: RectangleShape) => {
  // context.save()
  // context.beginPath()
  // context.fillStyle = rectangle.colorId
  // context.rect(rectangle.geometry.x, rectangle.geometry.y, rectangle.geometry.width, rectangle.geometry.height)
  // context.fill()
  // context.restore()
}

export const drawHelperShape = (context: CanvasRenderingContext2D, shape: ClientShape) => {
  return match(shape, {
    ellipse: (ellipse) => drawHelperEllipse(context, ellipse),
    rectangle: (rectangle) => drawHelperRectangle(context, rectangle),

    diamond: () => () => {},
    image: () => () => {},
    arrow: () => () => {},
    line: () => () => {},
    pen: () => () => {},
  }, "kind")
}