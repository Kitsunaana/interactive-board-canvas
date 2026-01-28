import { SELECTION_BOUNDS_PADDING } from "@/entities/shape/index.ts";
import type { EllipseShape, RectangleShape, Shape } from "@/entities/shape/model/types.ts";
import { generateRandomColor } from "@/shared/lib/color.ts";
import { initialCanvas } from "@/shared/lib/initial-canvas.ts";
import { match } from "@/shared/lib/match.ts";
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
    })
  }

  if (isNotNull(resizeHandlers)) {
    resizeHandlers.resizeHandlers.forEach((handler) => {
      context.beginPath()
      context.lineWidth = handler.strokeWidth
      context.fillStyle = resizeHandlers.linesColor[handler.corner]
      context.arc(handler.x, handler.y, handler.radius * 1.5, 0, Math.PI * 2)
      context.fill()
      context.closePath()
    })
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

export function drawRotateHandler({ colorId, context, rect }: {
  context: CanvasRenderingContext2D
  colorId: string
  rect: Rect
}) {
  context.save()

  context.fillStyle = colorId
  context.strokeStyle = colorId
  context.lineWidth = 1
  context.beginPath()
  context.arc(rect.x + rect.width / 2, rect.y - 12, 16, 0, Math.PI * 2)
  context.closePath()
  context.stroke()
  context.fill()
  
  context.restore()
}

function drawSelectionBounds({ context, lineColors, rect }: {
  context: CanvasRenderingContext2D
  lineColors: BoundLinesColor
  rect: Rect
}) {
  context.save()

  context.lineWidth = 7

  context.beginPath()
  context.strokeStyle = lineColors.top
  context.moveTo(rect.x - SELECTION_BOUNDS_PADDING, rect.y - SELECTION_BOUNDS_PADDING)
  context.lineTo(rect.x + rect.width + SELECTION_BOUNDS_PADDING, rect.y - SELECTION_BOUNDS_PADDING)
  context.stroke()
  context.closePath()

  context.beginPath()
  context.strokeStyle = lineColors.right
  context.moveTo(rect.x + rect.width + SELECTION_BOUNDS_PADDING, rect.y - SELECTION_BOUNDS_PADDING)
  context.lineTo(rect.x + rect.width + SELECTION_BOUNDS_PADDING, rect.y + rect.height + SELECTION_BOUNDS_PADDING)
  context.stroke()
  context.closePath()

  context.beginPath()
  context.strokeStyle = lineColors.bottom
  context.moveTo(rect.x + rect.width + SELECTION_BOUNDS_PADDING, rect.y + rect.height + SELECTION_BOUNDS_PADDING)
  context.lineTo(rect.x - SELECTION_BOUNDS_PADDING, rect.y + rect.height + SELECTION_BOUNDS_PADDING)
  context.stroke()
  context.closePath()

  context.beginPath()
  context.strokeStyle = lineColors.left
  context.moveTo(rect.x - SELECTION_BOUNDS_PADDING, rect.y + rect.height + SELECTION_BOUNDS_PADDING)
  context.lineTo(rect.x - SELECTION_BOUNDS_PADDING, rect.y - SELECTION_BOUNDS_PADDING)
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
    match(shape, {
      rectangle: (shape) => drawRectangle({ shape, context }),
      ellipse: (shape) => drawCircle({ shape, context }),
      square: () => { },
      arrow: () => { },
    }, "kind")
  })

  context.restore()
}

function drawRectangle({ context, shape }: {
  context: CanvasRenderingContext2D
  shape: RectangleShape
}) {
  context.save()
  context.beginPath()
  context.fillStyle = shape.colorId
  context.rect(shape.geometry.x, shape.geometry.y, shape.geometry.width, shape.geometry.height)
  context.fill()
  context.restore()
}

function drawCircle({ context, shape }: {
  context: CanvasRenderingContext2D
  shape: EllipseShape
}) {
  const radiusX = shape.geometry.rx / 2
  const radiusY = shape.geometry.ry / 2

  context.save()

  context.beginPath()
  context.ellipse(shape.geometry.cx + radiusX, shape.geometry.cy + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2)
  context.fillStyle = shape.colorId
  context.fill()

  context.restore()
}