import { animationFrames, combineLatest, map, startWith, tap, withLatestFrom } from "rxjs"
import { type Camera, cameraSubject$, getWorldPoints, gridTypeSubject$ } from "./modules/camera"
import { gridTypeVariants, LEVELS, toDrawOneLevel } from "./modules/grid"
import { getMiniMapRenderLoop, subscribeToMiniMapRenderLoop } from "./modules/mini-map"
import { miniMapCameraSubject$ } from "./modules/mini-map/stream"
import { drawSticker } from "./modules/node/draw"
import { drawActiveBox, getActiveBoxDots, nodesToView$, type NodeToView } from "./nodes"
import { canvas, context, resize$ } from "./setup"
import { getCanvasSizes, isNotNull } from "./utils"

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
  withLatestFrom(cameraSubject$, gridTypeSubject$, nodesToView$, miniMapCameraSubject$, gridProps$),
  map(([_, cameraState, gridType, nodes, miniMapCameraRect, { canvasProperties, gridProps }]) => ({
    ...cameraState,
    canvasSizes: canvasProperties.sizes,
    miniMapCameraRect,
    gridProps,
    gridType,
    nodes,
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
  nodes: NodeToView[],
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
