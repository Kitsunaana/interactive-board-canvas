import { animationFrames, combineLatest, map, startWith, tap, withLatestFrom } from "rxjs"
import { cameraSubject$, gridTypeSubject$ } from "./modules/camera"
import { getWorldPoints, sizesToPoint, type Camera } from "./modules/camera/domain"
import { drawDotsGrid, drawLinesGrid, LEVELS, toDrawOneLevel } from "./modules/grid"
import { canvas, context, initialCanvas, resize$ } from "./setup"
import { getCanvasSizes, isNotNull } from "./utils"

const canvasProperties$ = combineLatest([
    cameraSubject$,
    resize$.pipe(
        map(getCanvasSizes),
        startWith(getCanvasSizes()),
        tap((canvasSizes) => Object.assign(canvas, canvasSizes)),
    )
]).pipe(map(([state, sizes]) => getWorldPoints({ sizes, state })))

const gridProps$ = canvasProperties$.pipe(
    withLatestFrom(cameraSubject$),
    map(([canvasProperties, { camera }]) => ({
        canvasProperties,
        gridProps: LEVELS
            .map(level => toDrawOneLevel({ ...canvasProperties, camera, level }))
            .filter(isNotNull)
    }))
)

const renderLoop$ = animationFrames().pipe(
    withLatestFrom(cameraSubject$, gridTypeSubject$, gridProps$),
    map(([_, cameraState, gridType, { canvasProperties, gridProps }]) => ({
        ...cameraState,
        canvasSizes: canvasProperties.sizes,
        gridProps,
        gridType,
    }))
)

type Node = {
    x: number
    y: number
    id: string
    width: number
    height: number
}

const nodes: Node[] = [
    {
        id: "1",
        x: -200,
        y: -200,
        width: 100,
        height: 70,
    },
    {
        id: "1",
        x: -150,
        y: -150,
        width: 100,
        height: 70,
    },
    {
        id: "2",
        x: 200,
        y: 200,
        width: 100,
        height: 70,
    },
    {
        id: "2",
        x: 320,
        y: 2000,
        width: 100,
        height: 70,
    }
]

const miniMapUnscale = 3

const miniMapSizes = {
    height: window.innerHeight / miniMapUnscale,
    width: window.innerWidth / miniMapUnscale,
}

const findLimitMapPoints = (nodes: Node[]) => {
    return nodes.reduce(
        (foundPoints, node) => {
            foundPoints.min.x = Math.min(foundPoints.min.x, node.x + node.width)
            foundPoints.min.y = Math.min(foundPoints.min.y, node.y + node.height)
            foundPoints.max.x = Math.max(foundPoints.max.x, node.x + node.width)
            foundPoints.max.y = Math.max(foundPoints.max.y, node.y + node.height)

            return foundPoints
        },
        {
            max: sizesToPoint(miniMapSizes),
            min: {
                x: nodes[0].x,
                y: nodes[0].y
            },
        }
    )
}

const foundLimitMapPoints = findLimitMapPoints(nodes)
const fmin = foundLimitMapPoints.min

const isNegative = (value: number) => value < 0

const movedUnscaleNodes = nodes.map((node) => ({
    ...node,
    x: isNegative(fmin.x) ? node.x + Math.abs(fmin.x) : node.x - fmin.x,
    y: isNegative(fmin.y) ? node.y + Math.abs(fmin.y) : node.y - fmin.y,
}))

const foundLimitMapPointsV2 = findLimitMapPoints(movedUnscaleNodes)
const { min, max } = foundLimitMapPointsV2

const maxPointX = Math.max(min.x, max.x)
const maxPointY = Math.max(min.y, max.y)

const unscaleX = maxPointX / miniMapSizes.width
const unscaleY = maxPointY / miniMapSizes.height

const computedUnscaleMap = unscaleX > unscaleY ? unscaleX : unscaleY

const [miniMapContext] = initialCanvas({
    ...miniMapSizes,
    canvasId: "map",
})

const gridTypeVariants = {
    lines: drawLinesGrid,
    dots: drawDotsGrid,
}

renderLoop$.subscribe(({ canvasSizes, gridType, gridProps, camera }) => {
    context.save()

    context.clearRect(0, 0, canvasSizes.width, canvasSizes.height)

    context.translate(camera.x, camera.y)
    context.scale(camera.scale, camera.scale)

    gridTypeVariants[gridType]({ gridProps, context })

    renderNodes(context)

    miniMapContext.save()
    miniMapContext.clearRect(0, 0, miniMapSizes.width, miniMapSizes.height)
    renderMiniMap(miniMapContext, camera)
    miniMapContext.restore()

    context.restore()
})

function renderMiniMap(context: CanvasRenderingContext2D, camera: Camera) {
    context.beginPath()
    context.fillStyle = "rgba(0, 0, 0, 0.6)"
    context.rect(0, 0, miniMapSizes.width, miniMapSizes.height)
    context.fill()

    const scale = 1 / computedUnscaleMap

    context.scale(scale, scale)

    movedUnscaleNodes.forEach(({ x, y, width, height }) => {
        context.beginPath()
        context.fillStyle = "#fff8ac"
        context.rect(x, y, width, height)
        context.fill()
    })

    context.beginPath()
    context.fillStyle = "rgba(255, 255, 255, 0.3)"

    const viewWorldW = window.innerWidth / camera.scale
    const viewWorldH = window.innerHeight / camera.scale
    const viewWorldX = -camera.x / camera.scale
    const viewWorldY = -camera.y / camera.scale
    const finalX = viewWorldX - fmin.x
    const finalY = viewWorldY - fmin.y

    context.rect(finalX, finalY, viewWorldW, viewWorldH)
    context.fill()
}

function renderNodes(context: CanvasRenderingContext2D) {
    nodes.forEach(({ x, y, width, height }) => {
        context.beginPath()
        context.fillStyle = "#fff8ac"
        context.rect(x, y, width, height)
        context.fill()
    })
}