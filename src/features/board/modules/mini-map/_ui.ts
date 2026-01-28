import type { ClientShape } from "@/entities/shape/model/types"
import type { Rect, Sizes } from "@/shared/type/shared"

export const drawMiniMap = ({ shapes, sizes, context, unscale, cameraRect }: {
  context: CanvasRenderingContext2D
  shapes: ClientShape[]
  cameraRect: Rect
  unscale: number
  sizes: Sizes
}) => {
  context.save()
  context.clearRect(0, 0, sizes.width, sizes.height)

  drawCanvas({ context, sizes })

  const scale = 1 / unscale
  context.scale(scale, scale)

  drawShapes({ context, shapes })
  drawViewport({ context, cameraRect })

  context.restore()
}

function drawCanvas({ context, sizes }: {
  context: CanvasRenderingContext2D
  sizes: Sizes
}) {
  context.save()
  context.beginPath()
  context.fillStyle = "white"
  context.rect(0, 0, sizes.width, sizes.height)
  context.closePath()
  context.fill()
  context.restore()
}

function drawViewport({ context, cameraRect }: {
  context: CanvasRenderingContext2D
  cameraRect: Rect
}) {
  context.save()
  context.beginPath()
  context.fillStyle = "rgba(0, 0, 0, 0.3)"
  context.rect(
    cameraRect.x,
    cameraRect.y,
    cameraRect.width,
    cameraRect.height,
  )
  context.fill()
  context.restore()
}

function drawShapes({ context }: {
  context: CanvasRenderingContext2D
  shapes: ClientShape[]
}) {
  context.save()
  /**
  shapes.forEach((shape) => {
    match(shape, {
      ellipse: ({ height, width, x, y }) => {
        const radiusY = height / 2
        const radiusX = width / 2

        context.beginPath()
        context.fillStyle = "#ffe870"
        context.ellipse(x + radiusX, y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2)
        context.fill()
      },

      rectangle: ({ height, width, x, y }) => {
        context.beginPath()
        context.fillStyle = "#ffe870"
        context.rect(x, y, width, height)
        context.fill()
      }
    })
  })
  */
  context.restore()
}
