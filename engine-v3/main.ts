import * as Shape from "./shapes"
import './style.css'
import type { Point } from './types'

const canvasProperties = {
  width: window.innerWidth / 2,
  height: window.innerHeight,
  center: {
    x: window.innerWidth / 4,
    y: window.innerHeight / 2,
  }
}

const stageProperties = {
  width: 450,
  height: 480,
  x: canvasProperties.center.x - 450 / 2,
  y: canvasProperties.center.y - 480 / 2,
}

const cavnas = document.getElementById("canvas") as HTMLCanvasElement
const context = cavnas.getContext("2d") as CanvasRenderingContext2D

const helperCavnas = document.getElementById("helperCanvas") as HTMLCanvasElement
const helperContext = helperCavnas.getContext("2d") as CanvasRenderingContext2D

cavnas.width = window.innerWidth / 2
cavnas.height = window.innerHeight

helperCavnas.width = window.innerWidth / 2
helperCavnas.height = window.innerHeight

const clear = (context: CanvasRenderingContext2D) => {
  context.clearRect(0, 0, canvasProperties.width, canvasProperties.height)
}

const shapes: Array<Shape.Rectangle | Shape.Path> = []

const drawScene = (context: CanvasRenderingContext2D) => {
  clear(context)

  context.fillStyle = "gray"
  context.fillRect(0, 0, cavnas.width, cavnas.height)

  context.fillStyle = "white"
  context.fillRect(stageProperties.x, stageProperties.y, stageProperties.width, stageProperties.height)
}

const drawAllScenes = () => {
  drawScene(context)
  drawScene(helperContext)

  drawShapes()
}

drawAllScenes()

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
    cavnas.removeEventListener("pointerdown", downCallbackForSelect)
    cavnas.removeEventListener("pointerdown", downCallbackForPath)

    switch (selected) {
      case "rectangle":
        cavnas.addEventListener("pointerdown", downCallbackForRectangle)
        break
      case "select":
        cavnas.addEventListener("pointerdown", downCallbackForSelect)
        break
      case "path":
        cavnas.addEventListener("pointerdown", downCallbackForPath)
        break
    }
  }
}

const getFillColor = () => (document.getElementById("fillColor") as HTMLInputElement).value
const getStrokeColor = () => (document.getElementById("strokeColor") as HTMLInputElement).value
const getNeedFill = () => (document.getElementById("fill") as HTMLInputElement).checked
const getStrokeWidth = () => (
  (document.getElementById("strokeWidth") as HTMLInputElement).value
)

const getStyleOptions = () => {
  return {
    strokeWidth: Number(getStrokeWidth()),
    strokeColor: getStrokeColor(),
    fillColor: getFillColor(),
    fill: getNeedFill(),
  }
}

function downCallbackForSelect(event: PointerEvent) {
  const point = getOffsetPoint(event)

  const shape = shapes.find(shape => shape.hitTest(helperContext, point))
  
  if (shape !== undefined) {
    shape.selected = !shape.selected
  }

  const upCallback = (_event: PointerEvent) => {
    drawAllScenes()
    drawShapes()

    cavnas.removeEventListener("pointerup", upCallback)
  }

  cavnas.addEventListener("pointerup", upCallback)
}

function downCallbackForRectangle(event: PointerEvent) {
  const startPosition = getOffsetPoint(event)
  const rectangle = new Shape.Rectangle(startPosition, getStyleOptions())

  const moveCallback = (event: PointerEvent) => {
    const currentPosition = getOffsetPoint(event)

    rectangle.setEnd(currentPosition)

    drawAllScenes()
    drawShapes()

    rectangle.draw(context)
  }

  const upCallback = (_event: PointerEvent) => {
    shapes.push(rectangle)

    drawAllScenes()
    drawShapes()

    cavnas.removeEventListener("pointermove", moveCallback)
    cavnas.removeEventListener("pointerup", upCallback)
  }

  cavnas.addEventListener("pointermove", moveCallback)
  cavnas.addEventListener("pointerup", upCallback)
}

function downCallbackForPath(event: PointerEvent) {
  const mousePosition = getOffsetPoint(event)
  const path = new Shape.Path(mousePosition, getStyleOptions())

  const moveCallback = (event: PointerEvent) => {
    const mousePosition = getOffsetPoint(event)

    path.addPoint(mousePosition)

    drawAllScenes()
    drawShapes()

    path.draw(context)
  }

  const upCallback = (_event: PointerEvent) => {
    shapes.push(path)

    drawAllScenes()
    drawShapes()

    cavnas.removeEventListener("pointermove", moveCallback)
    cavnas.removeEventListener("pointerup", upCallback)
  }

  cavnas.addEventListener("pointermove", moveCallback)
  cavnas.addEventListener("pointerup", upCallback)
}

function drawShapes() {
  shapes.forEach((shape) => {
    shape.draw(context)
    shape.drawHitRegion(helperContext)
  })
}