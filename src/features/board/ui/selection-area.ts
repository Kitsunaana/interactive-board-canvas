import { SELECTION_BOUNDS_PADDING } from "@/entities/shape";
import type { SelectionBoundsArea } from "../domain/selection-area/_compute";

export const drawSelectionBoundsArea = ({ context, selectionBoundsArea }: {
  selectionBoundsArea: SelectionBoundsArea
  context: CanvasRenderingContext2D
}) => {
  context.save()

  context.strokeStyle = "#314cd9"
  context.lineWidth = 0.4

  selectionBoundsArea.bounds.forEach((rect) => {
    context.save()
    context.translate(rect.x + rect.width / 2, rect.y + rect.height / 2)
    context.rotate(rect.rotate)
    context.beginPath()
    context.rect(
      -rect.width / 2 - SELECTION_BOUNDS_PADDING,
      -rect.height / 2 - SELECTION_BOUNDS_PADDING,
      rect.width + SELECTION_BOUNDS_PADDING * 2,
      rect.height + SELECTION_BOUNDS_PADDING * 2
    )
    context.stroke()
    context.restore()
  })

  context.restore()
}