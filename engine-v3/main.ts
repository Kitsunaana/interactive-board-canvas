import { Point, type PointData } from "./Point"
import * as Shape from "./shapes"
import './style.css'

const SHOW_HELPER_CANVAS = false

if (SHOW_HELPER_CANVAS === false) {
  const helperCavnas = document.getElementById("helperCanvas") as HTMLCanvasElement
  helperCavnas.style.display = "none"
}

const canvasProperties = {
  width: SHOW_HELPER_CANVAS ? window.innerWidth / 2 : window.innerWidth,
  height: window.innerHeight,
  center: {
    x: window.innerWidth / (SHOW_HELPER_CANVAS ? 4 : 2),
    y: window.innerHeight / 2,
  }
}

const stageProperties = {
  width: 450,
  height: 480,
  x: 0,
  y: 0,
}

stageProperties.x = canvasProperties.center.x - stageProperties.width / 2
stageProperties.y = canvasProperties.center.y - stageProperties.height / 2

const cavnas = document.getElementById("canvas") as HTMLCanvasElement
const context = cavnas.getContext("2d") as CanvasRenderingContext2D

const helperCavnas = document.getElementById("helperCanvas") as HTMLCanvasElement
const helperContext = helperCavnas.getContext("2d") as CanvasRenderingContext2D

cavnas.width = SHOW_HELPER_CANVAS ? window.innerWidth / 2 : window.innerWidth
cavnas.height = window.innerHeight

helperCavnas.width = SHOW_HELPER_CANVAS ? window.innerWidth / 2 : window.innerWidth
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

const getOffsetPoint = (event: PointerEvent): PointData => ({
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

const fillColorInput = document.getElementById("fillColor") as HTMLInputElement
const strokeColorInput = document.getElementById("strokeColor") as HTMLInputElement
const needFillInput = document.getElementById("fill") as HTMLInputElement
const strokeWidthInput = document.getElementById("strokeWidth") as HTMLInputElement

const styleOptions = {
  strokeWidth: 1,
  strokeColor: "#0000ff",
  fillColor: "#00ffff",
  fill: true,
}

const mapSelectedShapes = (callback: (shape: Shape.Path | Shape.Rectangle) => void) => {
  shapes.forEach((shape) => {
    if (shape.selected) {
      callback(shape)
    }
  })
}

const changeFillColor = (event: Event) => {
  if (event.target instanceof HTMLInputElement) {
    styleOptions.fillColor = event.target.value

    mapSelectedShapes((shape) => {
      shape.options.fillColor = styleOptions.fillColor
    })

    drawAllScenes()
  }
}

const changeStrokeColor = (event: Event) => {
  if (event.target instanceof HTMLInputElement) {
    styleOptions.strokeColor = event.target.value

    mapSelectedShapes((shape) => {
      shape.options.strokeColor = styleOptions.strokeColor
    })

    drawAllScenes()
  }
}

const changeNeedFill = (event: Event) => {
  if (event.target instanceof HTMLInputElement) {
    styleOptions.fill = event.target.checked

    mapSelectedShapes((shape) => {
      shape.options.fill = styleOptions.fill
    })

    drawAllScenes()
  }
}

const changeStrokeWidth = (event: Event) => {
  if (event.target instanceof HTMLInputElement) {
    styleOptions.strokeWidth = Number(event.target.value)

    mapSelectedShapes((shape) => {
      shape.options.strokeWidth = styleOptions.strokeWidth
    })

    drawAllScenes()
  }
}

fillColorInput.addEventListener("input", changeFillColor)
strokeColorInput.addEventListener("input", changeStrokeColor)
needFillInput.addEventListener("input", changeNeedFill)
strokeWidthInput.addEventListener("input", changeStrokeWidth)

function downCallbackForSelect(event: PointerEvent) {
  const startPosition = getOffsetPoint(event)

  const shape = shapes.find(shape => shape.hitTest(helperContext, startPosition))

  if (shape !== undefined) {
    shape.selected = !shape.selected
  }

  const moveCallback = (event: PointerEvent) => {
    const currentPosition = getOffsetPoint(event)
    const delta = Point.subtractPoints(currentPosition, startPosition)

    if (shape) shape.setTranslate(delta)

    drawAllScenes()
    drawShapes()
  }

  const upCallback = (_event: PointerEvent) => {
    if (shape) shape.applyTranslate()

    drawAllScenes()
    drawShapes()

    cavnas.removeEventListener("pointermove", moveCallback)
    cavnas.removeEventListener("pointerup", upCallback)
  }

  cavnas.addEventListener("pointermove", moveCallback)
  cavnas.addEventListener("pointerup", upCallback)
}

function downCallbackForRectangle(event: PointerEvent) {
  const startPosition = getOffsetPoint(event)
  const rectangle = new Shape.Rectangle(startPosition, {
    ...styleOptions
  })

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
  const path = new Shape.Path(mousePosition, {
    ...styleOptions,
  })

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