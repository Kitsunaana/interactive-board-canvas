import { context } from "@/shared/lib/initial-canvas.ts";
import { match } from "@/shared/lib/match.ts";
import { drawSketchShape } from "@/shared/lib/sketch";
import type { ShapeToView } from "../domain/shape";

export const getShapeDrawer = (shape: ShapeToView) => {
  match(shape, {
    circle: (shape) => {
      if (shape.sketch) return drawSketchShape(shape)

      const radiusX = shape.width / 2
      const radiusY = shape.height / 2

      context.save()

      context.shadowColor = 'rgba(0, 0, 0, 0.2)'
      context.shadowOffsetX = 2
      context.shadowOffsetY = 2
      context.shadowBlur = 11

      context.beginPath()
      context.ellipse(shape.x + radiusX, shape.y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2)
      context.fillStyle = "#fff8ac"
      context.fill()

      context.restore()
    },

    rectangle: (shape) => {
      if (shape.sketch) return drawSketchShape(shape)

      context.save()
      context.shadowColor = 'rgba(0, 0, 0, 0.2)'
      context.shadowOffsetX = 2
      context.shadowOffsetY = 2
      context.shadowBlur = 11

      context.fillStyle = '#4f46e5'

      context.beginPath()
      context.fillStyle = "#fff8ac"
      context.rect(shape.x, shape.y, shape.width, shape.height)
      context.fill()
      context.restore()
    }
  })
}