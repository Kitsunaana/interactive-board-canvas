import { match } from "@/shared/lib/match"
import type { ClientShape, EllipseShape, RectangleShape } from "../../model/types"
import { ensureBitmap } from "../../model/render-state"
import { getBoundingBox } from "../../model/get-bounding-box"

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

export const drawVectorRectangle = (context: CanvasRenderingContext2D, rectangle: RectangleShape) => {
  const { geometry, style } = rectangle

  context.save()

  context.lineWidth = style.lineWidth
  context.fillStyle = style.fillColor
  context.strokeStyle = style.strokeColor

  const centerX = geometry.x + geometry.width / 2
  const centerY = geometry.y + geometry.height / 2

  context.translate(centerX, centerY)
  context.rotate(rectangle.transform.rotate)
  // context.translate(-centerX, -centerY)
  // context.translate(geometry.x, geometry.y)

  context.shadowColor = 'rgba(0, 0, 0, 0.2)'
  context.shadowOffsetX = 2
  context.shadowOffsetY = 2
  context.shadowBlur = 11

  // context.rotate(rectangle.transform.rotate)
  context.beginPath()
  // context.roundRect(geometry.x, geometry.y, geometry.height, style.borderRadius)

  context.roundRect(-geometry.width / 2, -geometry.height / 2, geometry.width, geometry.height, style.borderRadius)
  context.stroke()
  context.closePath()
  context.fill()

  context.restore()
}

export const drawShape = (context: CanvasRenderingContext2D, shape: ClientShape) => {
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

  ensureBitmap(shape)

  const renderMode = shape.client.renderMode

  if (renderMode.kind === "bitmap" && renderMode.dirty === false) {
    const bbox = getBoundingBox(shape.geometry, 0)

    context.save()
    context.translate(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2)
    context.rotate(shape.transform.rotate)
    context.drawImage(
      renderMode.bitmap,
      -(bbox.width + 10) / 2,
      -(bbox.height + 10) / 2,
      bbox.width + 10,
      bbox.height + 10
    )
    context.restore()
    return
  }

  match(shape, {
    rectangle: (shape) => drawVectorRectangle(context, shape)
  }, "kind")
}