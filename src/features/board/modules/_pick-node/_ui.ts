import { generateRandomColor } from "@/shared/lib/color.ts";
import { initialCanvas } from "@/shared/lib/initial-canvas.ts";
import { match } from "@/shared/lib/match.ts";
import { isNotNull } from "@/shared/lib/utils.ts";
import type { Rect } from "@/shared/type/shared.ts";
import type { Circle, Rectangle, Shape } from "../../domain";
import { SELECTION_BOUNDS_PADDING } from "../../ui/selection-bounds-area.ts";
import type { Camera } from "../_camera";
import type { BoundLinesColor, SelectionBoundsToPick } from "./_core.ts";

export const [_, canvas] = initialCanvas({
  height: window.innerHeight,
  width: window.innerWidth,
  canvasId: "canvas",
})

export const CANVAS_COLOR_ID = generateRandomColor()

type ResizeHandler = {
  strokeWidth: number
  radius: number
  x: number
  y: number
}

export function drawScene({ camera, context, shapes, selectionBounds, resizeHandlers }: {
  selectionBounds: SelectionBoundsToPick | null
  resizeHandlers: ResizeHandler[] | null
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
  }

  if (isNotNull(resizeHandlers)) {
    resizeHandlers.forEach((resizeHandler) => {
      context.beginPath()
      context.lineWidth = resizeHandler.strokeWidth
      context.arc(resizeHandler.x, resizeHandler.y, resizeHandler.radius * 1.5, 0, Math.PI * 2)
      context.fill()
      context.stroke()
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
      circle: (shape) => drawCircle({ shape, context }),
      square: () => { },
      arrow: () => { },
    })
  })

  context.restore()
}

function drawRectangle({ context, shape }: {
  context: CanvasRenderingContext2D
  shape: Rectangle
}) {
  context.save()
  context.beginPath()
  context.fillStyle = shape.colorId
  context.rect(shape.x, shape.y, shape.width, shape.height)
  context.fill()
  context.restore()
}

function drawCircle({ context, shape }: {
  context: CanvasRenderingContext2D
  shape: Circle
}) {
  const radiusX = shape.width / 2
  const radiusY = shape.height / 2

  context.save()

  context.beginPath()
  context.ellipse(shape.x + radiusX, shape.y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2)
  context.fillStyle = shape.colorId
  context.fill()

  context.restore()
}