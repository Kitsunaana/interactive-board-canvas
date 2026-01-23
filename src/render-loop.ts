import * as rx from "rxjs";
import type { ShapeToView } from "./features/board/domain/shape.ts";
import { type Camera } from "./features/board/modules/camera/_domain.ts";
import { camera$, canvasSizes$, gridTypeSubject$ } from "./features/board/modules/camera/_stream.ts";
import { gridTypeVariants } from "./features/board/ui/cavnas.ts";
import { drawSelectionBoundsArea } from "./features/board/ui/selection-area.ts";
import { getShapeDrawer } from "./features/board/ui/shape.ts";
import { gridProps$ } from "./features/board/view-model/canvas-props.ts";
import { selectionBounds$ } from "./features/board/view-model/selection-bounds.ts";
import { getResizeCorners } from "./features/board/view-model/shape-sketch.ts";
import { shapesToRender$ } from "./features/board/view-model/state/_view-model.ts";
import { context } from "./shared/lib/initial-canvas.ts";
import { isNotNull } from "./shared/lib/utils.ts";
import type { Rect } from "./shared/type/shared.ts";

export const renderLoop$ = rx.animationFrames().pipe(
  rx.withLatestFrom(
    gridTypeSubject$,
    selectionBounds$,
    shapesToRender$,
    canvasSizes$,
    gridProps$,
    camera$,
  ),
  rx.map(([_, gridType, selectionArea, shapes, canvasSizes, gridProps, camera]) => ({
    selectionArea,
    canvasSizes,
    gridProps,
    gridType,
    camera,
    shapes,
  }))
)

renderLoop$.subscribe(({ selectionArea, canvasSizes, gridType, gridProps, camera, shapes }) => {
  context.save()

  context.clearRect(0, 0, canvasSizes.width, canvasSizes.height)

  context.translate(camera.x, camera.y)
  context.scale(camera.scale, camera.scale)

  gridTypeVariants[gridType]({ gridProps, context })

  drawShapes({ context, shapes })

  if (isNotNull(selectionArea)) {
    drawSelectionBoundsArea({ context, rects: selectionArea.bounds.concat(selectionArea.area) })
    drawResizeHandlers({ context, camera, rect: selectionArea.area })
  }

  context.restore()
})

export function drawShapes({ context, shapes }: {
  context: CanvasRenderingContext2D
  shapes: ShapeToView[]
}) {
  shapes.forEach((rect) => {
    getShapeDrawer(rect)

    context.font = "16px Arial"
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText("Hello World", rect.x + rect.width / 2, rect.y + rect.height / 2);
  })
}

const baseLineWidth = 0.45
const scalePower = 0.75
const baseRadius = 5

export function drawResizeHandlers({ context, camera, rect }: {
  context: CanvasRenderingContext2D
  camera: Camera
  rect: Rect
}) {
  const dotLineWidth = baseLineWidth / Math.pow(camera.scale, scalePower)
  const dotRadius = baseRadius / Math.pow(camera.scale, scalePower)

  context.save()

  context.fillStyle = "#ffffff"
  context.strokeStyle = "#aaaaaa"

  getResizeCorners({ camera, rect }).forEach((dot) => {
    context.beginPath()
    context.lineWidth = dotLineWidth
    context.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2)
    context.fill()
    context.stroke()
    context.closePath()
  })

  context.restore()
}