import type { Rect, Sizes } from "@/shared/type/shared"

export const renderMiniMap = ({ nodes, sizes, context, unscale, cameraRect }: {
  context: CanvasRenderingContext2D
  cameraRect: Rect
  unscale: number
  nodes: Rect[]
  sizes: Sizes
}) => {
  context.save()
  context.clearRect(0, 0, sizes.width, sizes.height)

  context.beginPath()
  context.fillStyle = "white"
  context.rect(0, 0, sizes.width, sizes.height)
  context.closePath()
  context.fill()

  const scale = 1 / unscale
  context.scale(scale, scale)

  nodes.forEach(({ x, y, width, height }) => {
    context.beginPath()
    context.fillStyle = "#ffe870"
    context.rect(x, y, width, height)
    context.fill()
  })

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