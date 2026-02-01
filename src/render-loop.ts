import * as rx from "rxjs";
import { ShapeDrawer } from "./entities/shape/index.ts";
import type { ClientShape } from "./entities/shape/model/types.ts";
import { type Camera } from "./features/board/modules/camera/_domain.ts";
import { camera$, canvasSizes$, gridTypeSubject$ } from "./features/board/modules/camera/_stream.ts";
import { gridTypeVariants } from "./features/board/ui/cavnas.ts";
import { drawSelectionBoundsArea } from "./features/board/ui/selection-area.ts";
import { gridProps$ } from "./features/board/view-model/canvas-props.ts";
import { selectionBounds$ } from "./features/board/view-model/selection-bounds.ts";
import { getResizeCorners } from "./features/board/view-model/shape-sketch.ts";
import { selectionWindow$, shapesToView$, viewState$ } from "./features/board/view-model/state/_view-model.ts";
import { isShapesResize, isShapesRotate } from "./features/board/view-model/state/_view-model.type.ts";
import { context } from "./shared/lib/initial-canvas.ts";
import { isNotNull, isNotUndefined } from "./shared/lib/utils.ts";
import type { RotatableRect } from "./shared/type/shared.ts";

export const renderLoop$ = rx.combineLatest([
  gridTypeSubject$,
  selectionBounds$,
  selectionWindow$,
  shapesToView$,
  canvasSizes$,
  viewState$,
  gridProps$,
  camera$
]).pipe(
  rx.map(([gridType, selectionBounds, selectionWindow, shapes, canvasSizes, viewState, gridProps, camera]) => ({
    selectionBounds,
    selectionWindow,
    canvasSizes,
    gridProps,
    viewState,
    gridType,
    camera,
    shapes,
  }))
)

renderLoop$.subscribe(({ selectionBounds, selectionWindow, canvasSizes, viewState, gridType, gridProps, camera, shapes }) => {
  context.save()

  context.clearRect(0, 0, canvasSizes.width, canvasSizes.height)

  context.translate(camera.x, camera.y)
  context.scale(camera.scale, camera.scale)

  gridTypeVariants[gridType]({ gridProps, context })

  drawShapes({ context, shapes })

  if (isShapesResize(viewState)) {
    drawSelectionBoundsArea({
      context,
      selectionBoundsArea: {
        bounds: viewState.bounds,
        area: {
          ...viewState.boundingBox,
        }
      },
    })

    drawResizeHandlers({ context, camera, rect: viewState.boundingBox })
    drawRotateHandler({ context, camera, rect: viewState.boundingBox })
  }

  if (isNotNull(selectionBounds) && isShapesRotate(viewState)) {
    // const area = {
    //   ...viewState.boundingBox,
    //   rotate: viewState.rotate
    // }

    drawSelectionBoundsArea({
      context,
      dashed: true,
      selectionBoundsArea: {
        bounds: viewState.selection.bounds,
        area: viewState.selection.area,
      },
    })

    // drawResizeHandlers({ context, camera, rect: area })
    // drawRotateHandler({ context, camera, rect: area })
  }

  if (isNotNull(selectionBounds) && !isShapesResize(viewState) && !isShapesRotate(viewState)) {
    drawSelectionBoundsArea({
      selectionBoundsArea: selectionBounds,
      context,
    })

    drawResizeHandlers({ context, camera, rect: selectionBounds.area })
    drawRotateHandler({ context, camera, rect: selectionBounds.area })
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
  shapes: ClientShape[]
}) {
  shapes.forEach((shape) => {
    ShapeDrawer.drawShape(context, shape)
  })
}

const baseLineWidth = 0.45
const scalePower = 0.75
const baseRadius = 5
const baseOffset = 16

export function drawRotateHandler({ context, camera, rect }: {
  context: CanvasRenderingContext2D
  rect: RotatableRect
  camera: Camera
}) {
  const dotRadius = baseRadius / Math.pow(camera.scale, scalePower)
  const dotYOffset = baseOffset / Math.pow(camera.scale, 0.25)

  context.save()

  context.fillStyle = "#ffffff"
  context.strokeStyle = "#475fdc"
  context.lineWidth = 1

  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2

  context.translate(centerX, centerY)
  context.rotate(rect.rotate)

  context.beginPath()
  context.arc(0, -rect.height / 2 - dotYOffset, dotRadius, 0, Math.PI * 2)
  context.closePath()
  context.stroke()
  context.fill()

  context.restore()
}

export function drawResizeHandlers({ context, camera, rect }: {
  context: CanvasRenderingContext2D
  rect: RotatableRect
  camera: Camera
}) {
  const dotLineWidth = baseLineWidth / Math.pow(camera.scale, scalePower)
  const dotRadius = baseRadius / Math.pow(camera.scale, scalePower)

  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2

  context.save()

  context.fillStyle = "#ffffff"
  context.strokeStyle = "#aaaaaa"
  context.lineWidth = dotLineWidth

  context.translate(centerX, centerY)
  context.rotate(rect.rotate)

  getResizeCorners({ camera, rect }).forEach((dot) => {
    context.beginPath()
    context.arc(dot.x - centerX, dot.y - centerY, dotRadius, 0, Math.PI * 2)
    context.fill()
    context.stroke()
    context.closePath()
  })

  context.restore()
}