import { context } from "@/shared/lib/initial-canvas.ts";
import { match } from "@/shared/lib/match.ts";
import { drawSketchShape } from "@/shared/lib/sketch";
import type { ShapeToRender } from "../domain/shape";

export const getShapeDrawer = (shape: ShapeToRender) => {
  match(shape, {
    circle: (shape) => {
      if (shape.sketch) return drawSketchShape(shape)

      const radiusX = shape.width / 2
      const radiusY = shape.height / 2

      context.save()

      context.translate(shape.x + radiusX, shape.y + radiusY)

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

      context.fillStyle = "#fff8ac"

      context.translate(shape.x + shape.width / 2, shape.y + shape.height / 2)

      context.shadowColor = 'rgba(0, 0, 0, 0.2)'
      context.shadowOffsetX = 2
      context.shadowOffsetY = 2
      context.shadowBlur = 11

      context.rotate(0)
      context.beginPath()
      context.rect(-shape.width / 2, -shape.height / 2, shape.width, shape.height)
      context.closePath()
      context.fill()

      // context.fillStyle = "#000"
      // context.font = "16px Arial"
      // context.textAlign = "center"
      // context.textBaseline = "middle"
      // context.fillText("Hello World", 0, 0);

      context.restore()
    }
  })
}