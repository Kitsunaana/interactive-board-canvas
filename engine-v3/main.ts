import { isFunction } from "lodash"
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


type SubscribeCallback = (event: PointerEvent) => void

export abstract class Draggable {
  public abstract start(event: PointerEvent): void
  public abstract process(event: PointerEvent): void
  public abstract finish(event: PointerEvent): void

  private _downCallback: SubscribeCallback | null = null
  private _moveCallback: SubscribeCallback | null = null
  private _upCallback: SubscribeCallback | null = null

  public startPosition: PointData = Point.emptyPoint()
  public currentPosition: PointData = Point.emptyPoint()

  public getDelta() {
    return Point.subtractPoints(this.currentPosition, this.startPosition)
  }

  public subscribe() {
    this._moveCallback = (event: PointerEvent) => {
      this.currentPosition = getOffsetPoint(event)
      this.process(event)
    }

    this._upCallback = (event: PointerEvent) => {
      this.finish(event)

      if (isFunction(this._moveCallback) && isFunction(this._upCallback)) {
        cavnas.removeEventListener("pointermove", this._moveCallback)
        cavnas.removeEventListener("pointerup", this._upCallback)
      }
    }

    this._downCallback = (event: PointerEvent) => {
      this.startPosition = getOffsetPoint(event)
      this.start(event)

      cavnas.addEventListener("pointermove", this._moveCallback!)
      cavnas.addEventListener("pointerup", this._upCallback!)
    }

    cavnas.addEventListener("pointerdown", this._downCallback)
  }

  public unsubscribe() {
    if (isFunction(this._downCallback)) {
      cavnas.removeEventListener("pointerdown", this._downCallback)
    }
  }
}

export class SelectFlow extends Draggable {
  public shape: Shape.Path | Shape.Rectangle | undefined = undefined

  public start(event: PointerEvent): void {
    this.shape = shapes.find(
      (shape) => shape.hitTest(helperContext, this.startPosition)
    )
  }

  public process(event: PointerEvent): void {
    if (this.shape) this.shape.setTranslate(this.getDelta())
    drawAllScenes()
  }

  public finish(event: PointerEvent): void {
    if (this.shape) this.shape.applyTranslate()
    drawAllScenes()
  }
}

export class DrawRectangleFlow extends Draggable {
  public rectangle: Shape.Rectangle | null = null

  public start(event: PointerEvent): void {
    this.rectangle = new Shape.Rectangle(this.startPosition, {
      ...styleOptions
    })
  }

  public process(event: PointerEvent): void {
    drawAllScenes()

    this.rectangle?.setEnd(this.currentPosition)
    this.rectangle?.draw(context)
  }

  public finish(event: PointerEvent): void {
    shapes.push(this.rectangle!)
    drawAllScenes()
  }
}

export class DrawPathFlow extends Draggable {
  public path: Shape.Path | null = null

  public start(event: PointerEvent): void {
    this.path = new Shape.Path(this.startPosition, {
      ...styleOptions,
    })
  }

  public process(event: PointerEvent): void {
    drawAllScenes()

    this.path!.addPoint(this.currentPosition)
    this.path!.draw(context)
  }

  public finish(event: PointerEvent): void {
    shapes.push(this.path!)
    drawAllScenes()
  }
}

const drawPathFlow = new DrawPathFlow()
const shapeSelectFlow = new SelectFlow()
const drawRectangleFlow = new DrawRectangleFlow()

function changeTool(event: Event) {
  if (event.target instanceof HTMLSelectElement) {
    const selected = event.target.value

    drawRectangleFlow.unsubscribe()
    shapeSelectFlow.unsubscribe()
    drawPathFlow.unsubscribe()

    switch (selected) {
      case "rectangle":
        drawRectangleFlow.subscribe()
        break
      case "select":
        shapeSelectFlow.subscribe()
        break
      case "path":
        drawPathFlow.subscribe()
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

function drawShapes() {
  shapes.forEach((shape) => {
    shape.draw(context)
    shape.drawHitRegion(helperContext)
  })
}