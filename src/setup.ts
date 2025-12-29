import { fromEvent } from "rxjs"

type InitialCanvasParams = {
  canvasId: string
  height: number
  width: number
}

window.oncontextmenu = () => {}

export const initialCanvas = ({ width, height, canvasId }: InitialCanvasParams) => {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement
  const context = canvas.getContext("2d", {
    willReadFrequently: true
  }) as CanvasRenderingContext2D

  canvas.height = height
  canvas.width = width

  canvas.oncontextmenu = (event) => {
    event.preventDefault()
  }

  return [context, canvas] as const
}

export const [context, canvas] = initialCanvas({
  height: window.innerHeight / 2,
  width: window.innerWidth / 2,
  canvasId: "canvas",
})

export const resize$ = fromEvent(window, "resize")
