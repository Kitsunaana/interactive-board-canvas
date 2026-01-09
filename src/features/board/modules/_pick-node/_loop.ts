import { match } from "@/shared/lib/match"
import type { Shape } from "../../domain/dto"

export const renderHelperShapes = ({ context, shapes }: {
  context: CanvasRenderingContext2D
  shapes: Shape[]
}) => {
  context.save()

  shapes.forEach((shape) => {
    match(shape, {
      arrow: () => { },

      circle: ({ x, y, height, width, colorId }) => {
        const radiusX = width / 2
        const radiusY = height / 2

        context.save()

        context.beginPath()
        context.ellipse(x + radiusX, y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2)
        context.fillStyle = colorId
        context.fill()

        context.restore()
      },

      square: () => { },

      rectangle: ({ colorId, height, width, x, y }) => {
        context.save()
        context.beginPath()
        context.fillStyle = colorId
        context.rect(x, y, width, height)
        context.fill()
        context.restore()
      }
    })
  })

  context.restore()
}