import { SELECTION_BOUNDS_PADDING } from "@/entities/shape/index.ts";
import { drawHelperShape } from "@/entities/shape/lib/render/_drawer-helper.ts";
import type { Shape } from "@/entities/shape/model/types.ts";
import { generateRandomColor } from "@/shared/lib/color.ts";
import { initialCanvas } from "@/shared/lib/initial-canvas.ts";
import { isNotNull } from "@/shared/lib/utils.ts";
import type { Rect } from "@/shared/type/shared.ts";
import type { Camera } from "../camera/index.ts";
import type { BoundLinesColor, ResizeHandlersPropertiesToPick, SelectionBoundsToPick } from "./_core.ts";

export const [, canvas] = initialCanvas({
  height: window.innerHeight,
  width: window.innerWidth,
  canvasId: "canvas",
})

export const CANVAS_COLOR_ID = generateRandomColor()
export const ROTATE_HANDLER_COLOR_ID = generateRandomColor()

export function drawScene({ camera, context, shapes, selectionBounds, resizeHandlers }: {
  selectionBounds: SelectionBoundsToPick | null
  resizeHandlers: ResizeHandlersPropertiesToPick | null
  context: CanvasRenderingContext2D
  shapes: Shape[]
  camera: Camera
}) {
  context.save()
  context.clearRect(0, 0, context.canvas.width, context.canvas.height)

  drawCanvas({ context })

  context.translate(camera.x, camera.y)
  context.scale(camera.scale, camera.scale)

  drawShapes({ shapes, context })

  if (isNotNull(selectionBounds)) {
    drawSelectionBounds({
      lineColors: selectionBounds.linesColor,
      rect: selectionBounds.area,
      context,
    })

    drawRotateHandler({
      colorId: ROTATE_HANDLER_COLOR_ID,
      rect: selectionBounds.area,
      context,
      camera,
    })
  }

  if (isNotNull(resizeHandlers) && isNotNull(selectionBounds)) {
    const rect = selectionBounds.area

    const centerX = rect.x + rect.width / 2
    const centerY = rect.y + rect.height / 2

    context.save()

    context.fillStyle = "#ffffff"
    context.strokeStyle = "#aaaaaa"

    context.translate(centerX, centerY)
    context.rotate(rect.rotate)

    resizeHandlers.resizeHandlers.forEach((handler) => {
      context.beginPath()
      context.lineWidth = handler.strokeWidth
      context.fillStyle = resizeHandlers.linesColor[handler.corner]
      context.arc(handler.x - centerX, handler.y - centerY, handler.radius * 1.5, 0, Math.PI * 2)
      context.fill()
      context.closePath()
    })

    context.restore()
  }

  context.restore()
}

function drawCanvas({ context }: {
  context: CanvasRenderingContext2D
}) {
  context.save()
  context.fillStyle = CANVAS_COLOR_ID
  context.rect(0, 0, context.canvas.width, context.canvas.height)
  context.fill()
  context.restore()
}

const baseOffset = 16

export function drawRotateHandler({ colorId, camera, context, rect }: {
  context: CanvasRenderingContext2D
  colorId: string
  camera: Camera
  rect: Rect & { rotate: number }
}) {
  const dotYOffset = baseOffset / Math.pow(camera.scale, 0.25)

  context.save()

  context.strokeStyle = colorId
  context.fillStyle = colorId
  context.lineWidth = 1

  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2

  context.translate(centerX, centerY)
  context.rotate(rect.rotate)

  context.beginPath()
  context.arc(0, -rect.height / 2 - dotYOffset, 16, 0, Math.PI * 2)
  context.closePath()
  context.stroke()
  context.fill()

  context.restore()

  // context.save()

  // context.fillStyle = colorId
  // context.strokeStyle = colorId
  // context.lineWidth = 1
  // context.beginPath()
  // context.arc(rect.x + rect.width / 2, rect.y - 12, 16, 0, Math.PI * 2)
  // context.closePath()
  // context.stroke()
  // context.fill()

  // context.restore()
}

function drawSelectionBounds({ context, lineColors, rect }: {
  context: CanvasRenderingContext2D
  lineColors: BoundLinesColor
  rect: Rect & { rotate: number }
}) {
  context.save()

  context.lineWidth = 7

  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2

  context.translate(centerX, centerY)
  context.rotate(rect.rotate)

  context.beginPath()
  context.strokeStyle = lineColors.top
  context.moveTo(-rect.width / 2 - SELECTION_BOUNDS_PADDING, -rect.height / 2 - SELECTION_BOUNDS_PADDING)
  context.lineTo(-rect.width / 2 + rect.width + SELECTION_BOUNDS_PADDING, -rect.height / 2 - SELECTION_BOUNDS_PADDING)
  context.stroke()
  context.closePath()

  context.beginPath()
  context.strokeStyle = lineColors.right
  context.moveTo(-rect.width / 2 + rect.width + SELECTION_BOUNDS_PADDING, -rect.height / 2 - SELECTION_BOUNDS_PADDING)
  context.lineTo(-rect.width / 2 + rect.width + SELECTION_BOUNDS_PADDING, -rect.height / 2 + rect.height + SELECTION_BOUNDS_PADDING)
  context.stroke()
  context.closePath()

  context.beginPath()
  context.strokeStyle = lineColors.bottom
  context.moveTo(-rect.width / 2 + rect.width + SELECTION_BOUNDS_PADDING, -rect.height / 2 + rect.height + SELECTION_BOUNDS_PADDING)
  context.lineTo(-rect.width / 2 - SELECTION_BOUNDS_PADDING, -rect.height / 2 + rect.height + SELECTION_BOUNDS_PADDING)
  context.stroke()
  context.closePath()

  context.beginPath()
  context.strokeStyle = lineColors.left
  context.moveTo(-rect.width / 2 - SELECTION_BOUNDS_PADDING, -rect.height / 2 + rect.height + SELECTION_BOUNDS_PADDING)
  context.lineTo(-rect.width / 2 - SELECTION_BOUNDS_PADDING, -rect.height / 2 - SELECTION_BOUNDS_PADDING)
  context.stroke()
  context.closePath()

  context.restore()
}

function drawShapes({ context, shapes }: {
  context: CanvasRenderingContext2D
  shapes: Shape[]
}) {
  context.save()

  shapes.forEach((shape) => {
    drawHelperShape(context, shape)
  })

  context.restore()
}