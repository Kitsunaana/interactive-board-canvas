import { match } from "@/shared/lib/match"
import type { EllipseShape, RectangleShape, Shape } from "../../model/types"

export const drawDefaultEllipse = (context: CanvasRenderingContext2D, ellipse: EllipseShape) => {
  const radiusX = ellipse.geometry.cx / 2
  const radiusY = ellipse.geometry.cy / 2

  context.save()

  context.translate(ellipse.geometry.rx + radiusX, ellipse.geometry.ry + radiusY)

  context.shadowColor = 'rgba(0, 0, 0, 0.2)'
  context.shadowOffsetX = 2
  context.shadowOffsetY = 2
  context.shadowBlur = 11

  context.beginPath()
  // context.ellipse(ellipse.geometry.x + radiusX, ellipse.geometry.y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2)
  context.fillStyle = "#fff8ac"
  context.fill()

  context.restore()
}

export const drawRectangle = (context: CanvasRenderingContext2D, rectangle: RectangleShape) => {
  const { geometry, style } = rectangle

  context.save()

  context.lineWidth = style.lineWidth
  context.fillStyle = style.fillColor
  context.strokeStyle = style.strokeColor

  context.translate(geometry.x + geometry.width / 2, geometry.y + geometry.height / 2)

  context.shadowColor = 'rgba(0, 0, 0, 0.2)'
  context.shadowOffsetX = 2
  context.shadowOffsetY = 2
  context.shadowBlur = 11

  context.rotate(rectangle.transform.rotate)
  context.beginPath()
  context.roundRect(-geometry.width / 2, -geometry.height / 2, geometry.width, geometry.height, style.borderRadius)
  context.stroke()
  context.closePath()
  context.fill()

  context.restore()
}

export const drawShape = (context: CanvasRenderingContext2D, shape: Shape) => {
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

  match(shape, {
    rectangle: (shape) => drawRectangle(context, shape)
  }, "kind")
}