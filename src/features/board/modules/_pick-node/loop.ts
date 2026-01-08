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

      circle: () => { },

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