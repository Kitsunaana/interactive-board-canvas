import { animationFrames, combineLatest, map, startWith, tap, withLatestFrom } from "rxjs"
import { cameraSubject$, getWorldPoints, gridTypeSubject$, type Camera } from "./modules/camera"
import { gridTypeVariants, LEVELS, toDrawOneLevel } from "./modules/grid"
import { getMiniMapRenderLoop, subscribeToMiniMapRenderLoop } from "./modules/mini-map"
import { miniMapCameraSubject$ } from "./modules/mini-map/stream"
import { drawActiveBox, getActiveBoxDots, nodes$, nodesToView$, type Node, type NodeToView } from "./nodes"
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
    const { x, y, width, height } = rect

    context.save()
    context.shadowColor = 'rgba(0, 0, 0, 0.2)'
    context.shadowBlur = 9
    context.shadowOffsetX = 4
    context.shadowOffsetY = 4

    context.fillStyle = '#4f46e5'

    context.beginPath()
    context.fillStyle = "#fff8ac"
    context.rect(x, y, width, height)
    context.fill()
    context.restore()

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
