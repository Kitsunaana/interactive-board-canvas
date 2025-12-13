import { fromEvent } from "rxjs"

export const canvas = document.getElementById("canvas") as HTMLCanvasElement
export const context = canvas.getContext("2d", {
  willReadFrequently: true
}) as CanvasRenderingContext2D

canvas.height = window.innerHeight
canvas.width = window.innerWidth

export const resize$ = fromEvent(window, "resize")
