import type { Rect } from "@/shared/type/shared.ts";

export const SELECTION_BOUNDS_PADDING = 7

export const drawActiveBox = ({ context, rects, strokeStyle = "#314cd9", lineWidth = 0.4 }: {
  context: CanvasRenderingContext2D
  strokeStyle?: string
  lineWidth?: number
  rects: Rect[]
}) => {
  context.save()

  rects.forEach((rect) => {
    context.beginPath()
    context.strokeStyle = strokeStyle
    context.lineWidth = lineWidth
    context.moveTo(rect.x - SELECTION_BOUNDS_PADDING, rect.y - SELECTION_BOUNDS_PADDING)
    context.lineTo(rect.x + rect.width + SELECTION_BOUNDS_PADDING, rect.y - SELECTION_BOUNDS_PADDING)
    context.lineTo(rect.x + rect.width + SELECTION_BOUNDS_PADDING, rect.y + rect.height + SELECTION_BOUNDS_PADDING)
    context.lineTo(rect.x - SELECTION_BOUNDS_PADDING, rect.y + rect.height + SELECTION_BOUNDS_PADDING)
    context.lineTo(rect.x - SELECTION_BOUNDS_PADDING, rect.y - SELECTION_BOUNDS_PADDING)
    context.closePath()
    context.stroke()
  })
  
  context.restore()
}