import mitt from "mitt"
import { screenToCanvas } from "../point"
import type { Camera, Level, Point, ToDrawOneLevel } from "../type"
import { canvas } from "../setup"

type Events = {
  "grid-map:pointer-down": PointerEvent
  "grid-map:pointer-up": PointerEvent
  "grid-map:pointer-move": PointerEvent
  "grid-map:wheel": WheelEvent
}

export const emitter = mitt<Events>()

const defaultPoint: Point = {
  x: 0,
  y: 0,
}

const defaultCamera: Camera = {
  scale: 1,
  x: 0,
  y: 0,
}

class SubsciberToGridMap {
  private readonly zoomIntensity = 0.1
  private readonly zoomMinScale = 0.01
  private readonly zoomMaxScale = 10

  private readonly _camera: Camera = { ...defaultCamera }

  private readonly _pointerPosition: Point = { ...defaultPoint }

  private readonly _panOffset: Point = { ...defaultPoint }

  private _isPanning = false

  public get pointerPosition() {
    return this._pointerPosition
  }

  public get camera() {
    return this._camera
  }

  constructor(private readonly _canvas: HTMLCanvasElement) {
    emitter.on("grid-map:pointer-down", this._startDragging.bind(this))
    emitter.on("grid-map:pointer-up", this._stopDragging.bind(this))
    emitter.on("grid-map:pointer-move", this._dragging.bind(this))
    emitter.on("grid-map:wheel", this._changeZoom.bind(this))

    window.addEventListener("pointerdown", (event) => {
      emitter.emit("grid-map:pointer-down", event)
    })

    window.addEventListener("pointerup", (event) => {
      emitter.emit("grid-map:pointer-up", event)
    })

    window.addEventListener("pointermove", (event) => {
      emitter.emit("grid-map:pointer-move", event)
    })

    window.addEventListener("wheel", (event) => {
      emitter.emit("grid-map:wheel", event)
    }, { passive: true })
  }

  private _startDragging(event: PointerEvent) {
    if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
      this._isPanning = true

      this._panOffset.x = event.offsetX - this._camera.x
      this._panOffset.y = event.offsetY - this._camera.y

      this._canvas.style.cursor = "grabbing"
    }
  }

  private _dragging(event: PointerEvent) {
    this._pointerPosition.x = event.offsetX
    this._pointerPosition.y = event.offsetY

    if (this._isPanning) {
      this._camera.x = event.offsetX - this._panOffset.x
      this._camera.y = event.offsetY - this._panOffset.y
    }
  }

  private _stopDragging(_event: PointerEvent) {
    this._isPanning = false

    this._canvas.style.cursor = "default"
  }

  private _changeZoom(event: WheelEvent) {
    const delta = event.deltaY > 0 ? -this.zoomIntensity : this.zoomIntensity
    const newScale = this._camera.scale * (1 + delta)

    if (newScale < this.zoomMinScale || newScale > this.zoomMaxScale) return

    const mouseX = event.offsetX
    const mouseY = event.offsetY

    this._camera.x = mouseX - (mouseX - this._camera.x) * (newScale / this._camera.scale)
    this._camera.y = mouseY - (mouseY - this._camera.y) * (newScale / this._camera.scale)
    this._camera.scale = newScale
  }
}

export const subscriberToGridMap = new SubsciberToGridMap(canvas)

class GridToRenderLevels {
  private readonly _baseGridSize = 8
  private readonly _color = "#e5e5e5"

  private readonly _levels: Array<Level> = [
    { size: this._baseGridSize, minScale: 2.0 },
    { size: this._baseGridSize * 2, minScale: 1.0 },
    { size: this._baseGridSize * 4, minScale: 0.5 },
    { size: this._baseGridSize * 8, minScale: 0.25 },
    { size: this._baseGridSize * 16, minScale: 0.125 },
    { size: this._baseGridSize * 32, minScale: 0.0625 },
    { size: this._baseGridSize * 64, minScale: 0.03125 },
    { size: this._baseGridSize * 128, minScale: 0.015625 },
    { size: this._baseGridSize * 256, minScale: 0.0078125 },
    { size: this._baseGridSize * 512, minScale: 0.00390625 },
    { size: this._baseGridSize * 1024, minScale: 0.001953125 },
    { size: this._baseGridSize * 2048, minScale: 0 },
  ]

  public get levels() {
    return this._levels
  }

  public toDrawOneLevel: ToDrawOneLevel = ({ endWorld, startWorld, level }) => {
    const isScaleSmallerThanLevel = subscriberToGridMap.camera.scale < level.minScale

    if (isScaleSmallerThanLevel) return null

    const fadeProgress = this._getFadeProgress(level)

    if (fadeProgress <= 0) return null

    const startX = Math.floor(startWorld.x / level.size) * level.size
    const startY = Math.floor(startWorld.y / level.size) * level.size
    const endX = Math.ceil(endWorld.x / level.size) * level.size
    const endY = Math.ceil(endWorld.y / level.size) * level.size

    const opacity = fadeProgress * 0.5
    const strokeStyle = this._color + Math.floor(opacity * 255).toString(16).padStart(2, '0')
    const lineWidth = 1 / subscriberToGridMap.camera.scale

    return {
      strokeStyle,
      lineWidth,
      startX,
      startY,
      endX,
      endY,
    }
  }

  private _getNextLevelMinScale(level: typeof this._levels[number]) {
    return this._levels[this._levels.indexOf(level) - 1]?.minScale || level.minScale * 2
  }

  private _getFadeProgress(level: typeof this._levels[number]) {
    const nextLevelMinScale = this._getNextLevelMinScale(level)
    const fadeRange = nextLevelMinScale - level.minScale
    return Math.min(1, Math.max(0, (subscriberToGridMap.camera.scale - level.minScale) / fadeRange))
  }
}

const gridToRenderLevels = new GridToRenderLevels()

class GridViewCanvas {
  constructor(private readonly _gridToRenderLevels: GridToRenderLevels) { }

  toDrawGrid(context: CanvasRenderingContext2D) {
    context.save()

    const startPoint = {
      x: 0,
      y: 0,
    }

    const endPoint = {
      x: canvas.width,
      y: canvas.height,
    }

    const startWorld = screenToCanvas({
      camera: subscriberToGridMap.camera,
      point: startPoint,
    })

    const endWorld = screenToCanvas({
      camera: subscriberToGridMap.camera,
      point: endPoint,
    })

    this._gridToRenderLevels.levels.forEach(level => {
      const result = this._gridToRenderLevels.toDrawOneLevel({
        startWorld,
        endWorld,
        level
      })

      if (result === null) return

      const { strokeStyle, lineWidth, startX, startY, endX, endY } = result

      context.strokeStyle = strokeStyle
      context.lineWidth = lineWidth

      for (let x = startX; x <= endX; x += level.size) {
        context.beginPath()
        context.moveTo(x, startY)
        context.lineTo(x, endY)
        context.stroke()
      }

      for (let y = startY; y <= endY; y += level.size) {
        context.beginPath()
        context.moveTo(startX, y)
        context.lineTo(endX, y)
        context.stroke()
      }
    })

    context.restore()
  }
}

export const gridViewCanvas = new GridViewCanvas(gridToRenderLevels)
