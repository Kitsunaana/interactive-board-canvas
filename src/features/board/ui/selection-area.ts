import { SELECTION_BOUNDS_PADDING } from "@/entities/shape";
import type { SelectionBoundsArea } from "../domain/selection-area/_compute";

export const drawSelectionBoundsArea = ({ context, dashed, selectionBoundsArea: { area, bounds } }: {
  selectionBoundsArea: SelectionBoundsArea
  context: CanvasRenderingContext2D
  dashed?: boolean
}) => {
  context.save()

  context.strokeStyle = "#314cd9"
  context.lineWidth = 0.4

  context.save()
  context.beginPath()
  context.translate(area.x + area.width / 2, area.y + area.height / 2)
  context.rotate(area.rotate)
  if (dashed) context.setLineDash([5, 5])
  context.rect(
    -area.width / 2 - SELECTION_BOUNDS_PADDING,
    -area.height / 2 - SELECTION_BOUNDS_PADDING,
    area.width + SELECTION_BOUNDS_PADDING * 2,
    area.height + SELECTION_BOUNDS_PADDING * 2
  )
  context.closePath()
  context.stroke()
  context.restore()

  bounds.forEach((bound) => {
    context.save()
    context.translate(bound.x + bound.width / 2, bound.y + bound.height / 2)
    context.rotate(bound.rotate)
    context.beginPath()
    context.rect(
      -bound.width / 2 - SELECTION_BOUNDS_PADDING,
      -bound.height / 2 - SELECTION_BOUNDS_PADDING,
      bound.width + SELECTION_BOUNDS_PADDING * 2,
      bound.height + SELECTION_BOUNDS_PADDING * 2
    )
    context.stroke()
    context.restore()
  })

  context.restore()
}