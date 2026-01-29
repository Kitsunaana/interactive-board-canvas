import { match } from "@/shared/lib/match"
import type { EllipseShape, RectangleShape, Shape } from "../../model/types"

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

export const drawHelperRectangle = (context: CanvasRenderingContext2D, rectangle: RectangleShape) => {
  const { geometry, style } = rectangle

  context.save()

  context.lineWidth = style.lineWidth
  context.fillStyle = rectangle.colorId
  context.strokeStyle = rectangle.colorId

  context.translate(geometry.x + geometry.width / 2, geometry.y + geometry.height / 2)
  context.rotate(rectangle.transform.rotate)

  context.beginPath()
  context.roundRect(-geometry.width / 2, -geometry.height / 2, geometry.width, geometry.height, style.borderRadius)
  context.stroke()
  context.closePath()
  context.fill()

  context.restore()
}

export const drawHelperShape = (context: CanvasRenderingContext2D, shape: Shape) => {
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