import * as rx from "rxjs";
import { ShapeDrawer } from "./entities/shape/index.ts";
import type { ShapeToRender } from "./features/board/domain/shape.ts";
import { type Camera } from "./features/board/modules/camera/_domain.ts";
import { camera$, canvasSizes$, gridTypeSubject$ } from "./features/board/modules/camera/_stream.ts";
import { gridTypeVariants } from "./features/board/ui/cavnas.ts";
import { drawSelectionBoundsArea } from "./features/board/ui/selection-area.ts";
import { gridProps$ } from "./features/board/view-model/canvas-props.ts";
import { selectionBounds$ } from "./features/board/view-model/selection-bounds.ts";
import { getResizeCorners } from "./features/board/view-model/shape-sketch.ts";
import { selectionWindow$, shapesToRender$ } from "./features/board/view-model/state/_view-model.ts";
import { context } from "./shared/lib/initial-canvas.ts";
import { isNotNull, isNotUndefined } from "./shared/lib/utils.ts";
import type { Rect } from "./shared/type/shared.ts";

export const renderLoop$ = rx.animationFrames().pipe(
  rx.withLatestFrom(
    gridTypeSubject$,
    selectionBounds$,
    selectionWindow$,
    shapesToRender$,
    canvasSizes$,
    gridProps$,
    camera$,
  ),
  rx.map(([_, gridType, selectionBounds, selectionWindow, shapes, canvasSizes, gridProps, camera]) => ({
    selectionBounds,
    selectionWindow,
    canvasSizes,
    gridProps,
    gridType,
    camera,
    shapes,
  }))
)

renderLoop$.subscribe(({ selectionBounds, selectionWindow, canvasSizes, gridType, gridProps, camera, shapes }) => {
  context.save()

  context.clearRect(0, 0, canvasSizes.width, canvasSizes.height)

  context.translate(camera.x, camera.y)
  context.scale(camera.scale, camera.scale)

  gridTypeVariants[gridType]({ gridProps, context })

  drawShapes({ context, shapes })

  if (isNotNull(selectionBounds)) {
    drawSelectionBoundsArea({ context, rects: selectionBounds.bounds.concat(selectionBounds.area) })
    drawResizeHandlers({ context, camera, rect: selectionBounds.area })
  }

  if (isNotUndefined(selectionWindow)) {
    context.save()
    context.beginPath()
    context.fillStyle = "#3859ff"
    context.strokeStyle = "#3859ff"
    context.rect(selectionWindow.x, selectionWindow.y, selectionWindow.width, selectionWindow.height)
    context.closePath()
    context.globalAlpha = 0.1
    context.fill()
    context.globalAlpha = 1
    context.lineWidth = 0.5
    context.stroke()
    context.restore()
  }


  context.restore()
})

export function drawShapes({ context, shapes }: {
  context: CanvasRenderingContext2D
  shapes: ShapeToRender[]
}) {
  shapes.forEach((shape) => {
    ShapeDrawer.drawShape(context, shape)

    // context.font = "16px Arial"
    // context.textAlign = "center"
    // context.textBaseline = "middle"
    // context.fillText("Hello World", rect.x + rect.width / 2, rect.y + rect.height / 2);
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