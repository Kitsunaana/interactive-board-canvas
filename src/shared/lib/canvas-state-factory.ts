import type { RefCallback } from "react"
import { BehaviorSubject, combineLatest, filter, fromEvent, tap } from "rxjs"
import { getCanvasSizes, isNotNull } from "./utils"

type InitialCanvasParams = {
  height: number
  width: number
}

export type CanvasState = {
  context: CanvasRenderingContext2D | null
  canvas: HTMLCanvasElement | null
  isShow: boolean
}

export type CanvasStateReady = CanvasState & {
  context: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
}

export const resize$ = fromEvent(window, "resize")

export const canvasStateFactory = ({ width, height }: InitialCanvasParams) => {
  const canvasState$ = new BehaviorSubject<CanvasState>({
    context: null,
    canvas: null,
    isShow: true,
  })

  const readyCanvasState$ = canvasState$.pipe(
    filter((state): state is CanvasStateReady => isNotNull(state.canvas) || isNotNull(state.context)),
  )

  combineLatest([readyCanvasState$, resize$])
    .pipe(tap(([canvasState]) => Object.assign(canvasState.canvas, getCanvasSizes())))
    .subscribe()

  const readyCanvas: RefCallback<HTMLCanvasElement> = (canvas) => {
    if (isNotNull(canvas)) {
      const context = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D

      canvas.height = height
      canvas.width = width

      canvas.oncontextmenu = (event) => event.preventDefault()

      canvasState$.next({
        isShow: true,
        context,
        canvas,
      })
    }
  }

  return {
    readyCanvas,
    readyCanvasState$,
  }
}

export const mainCanvasState = canvasStateFactory(getCanvasSizes())