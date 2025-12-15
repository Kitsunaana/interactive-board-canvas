import { animationFrames, combineLatest, map, startWith, tap, withLatestFrom } from "rxjs"
import { cameraSubject$, gridTypeSubject$ } from "./modules/camera"
import { getWorldPoints } from "./modules/camera"
import { gridTypeVariants, LEVELS, toDrawOneLevel } from "./modules/grid"
import { getMiniMapRenderLoop, subscribeToMiniMapRenderLoop } from "./modules/mini-map"
import { nodes$, type Node } from "./nodes"
import { canvas, context, resize$ } from "./setup"
import { getCanvasSizes, isNotNull } from "./utils"

export const canvasProperties$ = combineLatest([
    cameraSubject$,
    resize$.pipe(
        map(getCanvasSizes),
        startWith(getCanvasSizes()),
        tap((canvasSizes) => Object.assign(canvas, canvasSizes)),
    )
]).pipe(map(([state, sizes]) => getWorldPoints({ sizes, state })))

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
    withLatestFrom(cameraSubject$, gridTypeSubject$, nodes$, gridProps$),
    map(([_, cameraState, gridType, nodes, { canvasProperties, gridProps }]) => ({
        ...cameraState,
        canvasSizes: canvasProperties.sizes,
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
    renderNodes(context, nodes)

    context.restore()
})

getMiniMapRenderLoop(renderLoop$).subscribe(subscribeToMiniMapRenderLoop)

function renderNodes(context: CanvasRenderingContext2D, nodes: Node[]) {
    nodes.forEach(({ x, y, width, height }) => {
        context.beginPath()
        context.fillStyle = "#fff8ac"
        context.rect(x, y, width, height)
        context.fill()
    })
}