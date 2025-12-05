import { fromEvent } from "rxjs"

const canvas = document.getElementById("canvas") as HTMLCanvasElement
const context = canvas.getContext("2d") as CanvasRenderingContext2D

canvas.height = window.innerHeight
canvas.width = window.innerWidth

export const resize$ = fromEvent(window, "resize")

export {
  context,
  canvas,
}
