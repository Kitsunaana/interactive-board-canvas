import { animationFrames, combineLatest, map, startWith, tap, withLatestFrom } from "rxjs";
import { getActiveBoxDots } from "./features/board/domain/sticker.ts";
import { getWorldPoints, type Camera } from "./features/board/modules/_camera/_domain.ts";
import { camera$, cameraSubject$, gridTypeSubject$ } from "./features/board/modules/_camera/_stream.ts";
import { drawActiveBox } from "./features/board/ui/active-box.ts";
import { gridTypeVariants, LEVELS, toDrawOneLevel } from "./features/board/ui/grid.ts";
import { selectedRect$, viewModel$ } from "./features/board/view-model/state";
import { mapRight } from "./shared/lib/either.ts";
import { canvas, context, resize$ } from "./shared/lib/initial-canvas.ts";
import { getCanvasSizes, isNotNull } from "./shared/lib/utils.ts";
import type { Rect } from "./shared/type/shared.ts";
import { getShapeDrawer } from "./features/board/ui/sketch/sticker/draw.ts";
import type { ShapeToView } from "./features/board/domain/dto.ts";

export const canvasProperties$ = combineLatest([
  cameraSubject$,
  resize$.pipe(
    map(getCanvasSizes),
    startWith(getCanvasSizes()),
    tap((canvasSizes) => Object.assign(canvas, canvasSizes)),
  )
]).pipe(map(([state, sizes]) => getWorldPoints({
  camera: state.camera,
  sizes,
})))

export const gridProps$ = canvasProperties$.pipe(
  withLatestFrom(cameraSubject$),
  map(([canvasProperties, { camera }]) => ({
    canvasProperties,
    gridProps: LEVELS
      .map(level => toDrawOneLevel({ ...canvasProperties, camera, level }))
      .filter(isNotNull)
  }))
)

export const renderLoop$ = animationFrames().pipe(
  withLatestFrom(
    camera$,
    gridTypeSubject$,
    viewModel$,
    selectedRect$,
    gridProps$
  ),
  map(([_, camera, gridType, viewModel, selectedRect, { canvasProperties, gridProps }]) => ({
    canvasSizes: canvasProperties.sizes,
    nodes: viewModel.nodes,
    selectedRect,
    gridProps,
    gridType,
    camera,
  }))
)

renderLoop$.subscribe(({ selectedRect, canvasSizes, gridType, gridProps, camera, nodes }) => {
  context.save()

  context.clearRect(0, 0, canvasSizes.width, canvasSizes.height)

  context.translate(camera.x, camera.y)
  context.scale(camera.scale, camera.scale)

  gridTypeVariants[gridType]({ gridProps, context })

  renderShapes({ context, shapes: nodes })

  mapRight(selectedRect, ({ main, rects }) => {
    drawActiveBox({ context, rects: rects.concat(main) })
    drawActiveBoxDots({ context, camera, rect: main })
  })

  context.restore()
})

export function renderShapes({ context, shapes }: {
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

function drawActiveBoxDots({ context, camera, rect }: {
  context: CanvasRenderingContext2D
  camera: Camera
  rect: Rect
}) {
  const dotLineWidth = baseLineWidth / Math.pow(camera.scale, scalePower)
  const dotRadius = baseRadius / Math.pow(camera.scale, scalePower)

  context.save()

  context.fillStyle = "#ffffff"
  context.strokeStyle = "#aaaaaa"

  getActiveBoxDots({ camera, rect }).forEach((dot) => {
    context.beginPath()
    context.lineWidth = dotLineWidth
    context.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2)
    context.fill()
    context.stroke()
    context.closePath()
  })

  context.restore()
}