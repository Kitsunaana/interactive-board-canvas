import { animationFrames, combineLatest, map, startWith, tap, withLatestFrom } from "rxjs"
import { cameraSubject$, gridTypeSubject$ } from "./modules/camera"
import { getWorldPoints } from "./modules/camera/domain"
import { drawDotsGrid, drawLinesGrid, LEVELS, toDrawOneLevel } from "./modules/grid"
import { canvas, context, resize$ } from "./setup"
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

renderLoop$.subscribe(({ canvasSizes, gridType, gridProps, camera }) => {
    context.save()

    context.clearRect(0, 0, canvasSizes.width, canvasSizes.height)

    context.translate(camera.x, camera.y)
    context.scale(camera.scale, camera.scale)

        ; ({
            lines: drawLinesGrid,
            dots: drawDotsGrid
        })[gridType]({
            generatedProperties: gridProps,
            context,
        })


    context.rect(100, 100, 100, 100)
    context.fill()

    context.restore()
})
