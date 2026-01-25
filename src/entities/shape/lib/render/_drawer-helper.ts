import { match } from "@/shared/lib/match"
import type { Ellipse, Shape, Rectangle } from "../../model/types"

export const drawHelperEllipse = (context: CanvasRenderingContext2D, ellipse: Ellipse) => {
  const radiusX = ellipse.width / 2
  const radiusY = ellipse.height / 2

  context.save()

  context.beginPath()
  context.ellipse(ellipse.x + radiusX, ellipse.y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2)
  context.fillStyle = ellipse.colorId
  context.fill()

  context.restore()
}

export const drawHelperRectangle = (context: CanvasRenderingContext2D, rectangle: Rectangle) => {
  context.save()
  context.beginPath()
  context.fillStyle = rectangle.colorId
  context.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height)
  context.fill()
  context.restore()
}

export const drawHelperShape = (context: CanvasRenderingContext2D, shape: Shape) => {
  return match(shape, {
    ellipse: (ellipse) => drawHelperEllipse(context, ellipse),
    rectangle: (rectangle) => drawHelperRectangle(context, rectangle),

    rhombus: (ellipse) => () => { },
    arrow: (ellipse) => () => { },
    image: (ellipse) => () => { },
    line: (ellipse) => () => { },
    path: (ellipse) => () => { },
    text: (ellipse) => () => { },
  })
}