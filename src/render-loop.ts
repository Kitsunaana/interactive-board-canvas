import { animationFrames, combineLatest, map, startWith, tap, withLatestFrom } from "rxjs"
import {canvas, context, resize$} from "./shared/lib/initial-canvas.ts";
import {getCanvasSizes, isNotNull} from "./shared/lib/utils.ts";
import {getActiveBoxDots, type StickerToView} from "./features/board/domain/sticker.ts";
import {drawActiveBox} from "./features/board/ui/active-box.ts";
import {getMiniMapRenderLoop, miniMapCameraSubject$} from "./features/board/stream/mini-map.ts";
import {subscribeToMiniMapRenderLoop} from "./features/board/ui/mini-map.ts";
import {cameraSubject$, gridTypeSubject$} from "./features/board/stream/camera.ts";
import {type Camera, getWorldPoints} from "./features/board/domain/camera.ts";
import {drawSticker} from "./features/board/ui/sketch/sticker/draw.ts";
import {viewModel$} from "./features/board/view-model/state";
import {gridTypeVariants, LEVELS, toDrawOneLevel} from "./features/board/ui/grid.ts";

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
  withLatestFrom(cameraSubject$, gridTypeSubject$, viewModel$, miniMapCameraSubject$, gridProps$),
  map(([_, cameraState, gridType, viewModel, miniMapCameraRect, { canvasProperties, gridProps }]) => ({
    ...cameraState,
    canvasSizes: canvasProperties.sizes,
    nodes: viewModel.nodes,
    miniMapCameraRect,
    gridProps,
    gridType,
  }))
)

renderLoop$.subscribe(({ canvasSizes, gridType, gridProps, camera, nodes }) => {
  context.save()

  context.clearRect(0, 0, canvasSizes.width, canvasSizes.height)

  context.translate(camera.x, camera.y)
  context.scale(camera.scale, camera.scale)

  gridTypeVariants[gridType]({ gridProps, context })

  renderNodes(context, nodes, camera)

  context.restore()
})

const miniMapRenderLoop$ = getMiniMapRenderLoop(renderLoop$)

miniMapRenderLoop$.subscribe(subscribeToMiniMapRenderLoop)

export function renderNodes(
  context: CanvasRenderingContext2D,
  nodes: StickerToView[],
  camera: Camera
) {
  nodes.forEach((rect) => {
    drawSticker.variant[rect.variant](rect as any)

    context.font = "16px Arial"
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText("Hello World", rect.x + rect.width / 2, rect.y + rect.height / 2);

    if (rect.isSelected) {
      context.save()

      drawActiveBox({
        rect,
        camera,
        context,
        activeBoxDots: getActiveBoxDots({
          camera,
          rect
        }),
      })

      context.restore()
    }
  })
}
