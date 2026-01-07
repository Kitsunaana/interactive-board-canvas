import type { Rect } from "@/shared/type/shared.ts";

const padding = 7

export const drawActiveBox = ({ context, rects }: {
  context: CanvasRenderingContext2D
  rects: Rect[]
}) => {
  context.save()

  rects.forEach((rect) => {
    context.beginPath()
    context.strokeStyle = "#314cd9"
    context.lineWidth = 0.4
    context.moveTo(rect.x - padding, rect.y - padding)
    context.lineTo(rect.x + rect.width + padding, rect.y - padding)
    context.lineTo(rect.x + rect.width + padding, rect.y + rect.height + padding)
    context.lineTo(rect.x - padding, rect.y + rect.height + padding)
    context.lineTo(rect.x - padding, rect.y - padding)
    context.closePath()
    context.stroke()
  })
  
  context.restore()
}