import { animationFrames, map, startWith, tap, withLatestFrom } from "rxjs"
import { generateGridPropertiesToRender, drawGrid } from "./grid-map/v2"
import { camera$ } from "./rx/camera"
import { canvas, context, resize$ } from "./setup-v2"
import type { Camera, Point } from "./type"

export type StartDraggingReturn = {
  lastPosition: Point
  panOffset: Point
  velocity: Point
  camera: Camera
}

const getCanvasSizes = () => ({
  height: window.innerHeight,
  width: window.innerWidth,
})

const renderLoop$ = animationFrames()
  .pipe(
    withLatestFrom(camera$, resize$
      .pipe(
        map(getCanvasSizes),
        startWith(getCanvasSizes()),
        tap((value) => {
          canvas.height = value.height
          canvas.width = value.width
        })
      )),
    map(([timestamp, cameraState, canvasSizes]) => ({
      ...cameraState,
      timestamp,
      canvasSizes,
      gridProps: generateGridPropertiesToRender({
        camera: cameraState.camera,
        canvasSizes,
      }),
    }))
  )

renderLoop$.subscribe(({ canvasSizes, gridProps, camera }) => {
  context.save()

  context.clearRect(0, 0, canvasSizes.width, canvasSizes.height)

  context.translate(camera.x, camera.y)
  context.scale(camera.scale, camera.scale)

  drawGrid({
    generatedProperties: gridProps,
    context,
  })

  context.restore()
})