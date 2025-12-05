import { animationFrames, map, startWith, tap, withLatestFrom } from "rxjs"
import { camera$ } from "./camera"
import { drawGrid, generateGridPropertiesToRender } from "./grid-map/v2"
import { canvas, context, resize$ } from "./setup"
import { gridActor } from "./xstate"

const getCanvasSizes = () => ({
  height: window.innerHeight,
  width: window.innerWidth,
})

const renderLoop$ = animationFrames().pipe(
  withLatestFrom(camera$, resize$.pipe(
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

  const gridType = gridActor.getSnapshot().context.gridType

  if (gridType === "lines") {
    drawGrid({
      generatedProperties: gridProps,
      context,
    })
  }

  context.rect(100, 100, 100, 100)
  context.fill()

  context.restore()
})
