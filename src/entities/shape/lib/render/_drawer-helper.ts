import { match } from "@/shared/lib/match"
import { subtractPoint } from "@/shared/lib/point"
import { getBoundingBox } from "../../model/get-bounding-box"
import type { EllipseShape, PenShape, RectangleShape, Shape } from "../../model/types"

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

export const drawHelperPath = (context: CanvasRenderingContext2D, shape: PenShape) => {
  const points = shape.geometry.points

  const bbox = getBoundingBox(shape.geometry, 0)
  
  const centerX = bbox.x + bbox.width / 2
  const centerY = bbox.y + bbox.height / 2
  
  const center = { x: centerX, y: centerY }

  const firstPoint = subtractPoint(center, points[0])
  
  context.save()
  context.translate(centerX, centerY)
  context.rotate(shape.transform.rotate)

  context.beginPath()
  context.moveTo(firstPoint.x, firstPoint.y)

  for (let i = 1; i < points.length; i++) {
    const point = subtractPoint(center, points[i])

    context.lineTo(point.x, point.y)
  }

  context.strokeStyle = shape.colorId
  context.fillStyle = shape.colorId

  context.lineJoin = "round"
  context.lineCap = "round"

  context.closePath()
  context.stroke()
  context.fill()
  context.restore()
}

export const drawHelperShape = (context: CanvasRenderingContext2D, shape: Shape) => {
  return match(shape, {
    rectangle: (rectangle) => drawHelperRectangle(context, rectangle),
    ellipse: (ellipse) => drawHelperEllipse(context, ellipse),
    pen: (shape) => drawHelperPath(context, shape),

    diamond: () => () => { },
    image: () => () => { },
    arrow: () => () => { },
    line: () => () => { },
  }, "kind")
}