import * as Shape from "./shapes"
import './style.css'
import type { Point } from './types'

const canvasProperties = {
  width: window.innerWidth,
  height: window.innerHeight,
  center: {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  }
}

const stageProperties = {
  width: 600,
  height: 480,
  x: canvasProperties.center.x - 600 / 2,
  y: canvasProperties.center.y - 480 / 2,
}

const cavnas = document.getElementById("canvas") as HTMLCanvasElement
const context = cavnas.getContext("2d") as CanvasRenderingContext2D

cavnas.width = window.innerWidth
cavnas.height = window.innerHeight

const clear = () => context.clearRect(0, 0, canvasProperties.width, canvasProperties.height)

const drawScene = () => {
  clear()

  context.fillStyle = "gray"
  context.fillRect(0, 0, cavnas.width, cavnas.height)

  context.fillStyle = "white"
  context.fillRect(stageProperties.x, stageProperties.y, stageProperties.width, stageProperties.height)
}

drawScene()

const shapes: Array<Shape.Rectangle | Shape.Path> = []

const getOffsetPoint = (event: PointerEvent): Point => ({
  x: event.offsetX,
  y: event.offsetY,
})

const toolBox = document.getElementById("shape") as HTMLSelectElement

toolBox.addEventListener("change", changeTool)

function changeTool(event: Event) {
  if (event.target instanceof HTMLSelectElement) {
    const selected = event.target.value

    cavnas.removeEventListener("pointerdown", downCallbackForRectangle)
    cavnas.removeEventListener("pointerdown", downCallbackForPath)

    switch (selected) {
      case "rectangle":
        cavnas.addEventListener("pointerdown", downCallbackForRectangle)
        break
      case "path":
        cavnas.addEventListener("pointerdown", downCallbackForPath)
        break
    }
  }
}

const getFillColor = () => (document.getElementById("fillColor") as HTMLInputElement).value
const getStrokeColor = () => (document.getElementById("strokeColor") as HTMLInputElement).value

function downCallbackForRectangle(event: PointerEvent) {
  const startPosition = getOffsetPoint(event)
  const rectangle = new Shape.Rectangle(startPosition, {
    stroke: getStrokeColor(),
    fill: getFillColor(),
    lineWidth: 3,
  })

  const moveCallback = (event: PointerEvent) => {
    const currentPosition = getOffsetPoint(event)

    rectangle.setEnd(currentPosition)

    drawScene()
    drawShapes(context)

    rectangle.draw(context)
  }

  const upCallback = (_event: PointerEvent) => {
    shapes.push(rectangle)

    drawScene()
    drawShapes(context)

    cavnas.removeEventListener("pointermove", moveCallback)
    cavnas.removeEventListener("pointerup", upCallback)
  }

  cavnas.addEventListener("pointermove", moveCallback)
  cavnas.addEventListener("pointerup", upCallback)
}

function downCallbackForPath(event: PointerEvent) {
  const mousePosition = getOffsetPoint(event)
  const path = new Shape.Path(mousePosition)

  const moveCallback = (event: PointerEvent) => {
    const mousePosition = getOffsetPoint(event)

    path.addPoint(mousePosition)

    drawScene()
    drawShapes(context)

    path.draw(context)
  }

  const upCallback = (_event: PointerEvent) => {
    shapes.push(path)

    drawScene()
    drawShapes(context)

    cavnas.removeEventListener("pointermove", moveCallback)
    cavnas.removeEventListener("pointerup", upCallback)
  }

  cavnas.addEventListener("pointermove", moveCallback)
  cavnas.addEventListener("pointerup", upCallback)
}

function drawShapes(context: CanvasRenderingContext2D) {
  shapes.forEach((shape) => {
    shape.draw(context)
  })
}


// 3 00 05