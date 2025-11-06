import { canvasCamera } from "../new/camera/model"
import { screenToCanvas } from "../point"
import { canvas } from "../setup"
import type { Level, ToDrawOneLevel } from "../type"

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
    const isScaleSmallerThanLevel = canvasCamera.camera.scale < level.minScale

    if (isScaleSmallerThanLevel) return null

    const fadeProgress = this._getFadeProgress(level)

    if (fadeProgress <= 0) return null

    const startX = Math.floor(startWorld.x / level.size) * level.size
    const startY = Math.floor(startWorld.y / level.size) * level.size
    const endX = Math.ceil(endWorld.x / level.size) * level.size
    const endY = Math.ceil(endWorld.y / level.size) * level.size

    const opacity = fadeProgress * 0.5
    const strokeStyle = this._color + Math.floor(opacity * 255).toString(16).padStart(2, '0')
    const lineWidth = 1 / canvasCamera.camera.scale

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
    return Math.min(1, Math.max(0, (canvasCamera.camera.scale - level.minScale) / fadeRange))
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
      camera: canvasCamera.camera,
      point: startPoint,
    })

    const endWorld = screenToCanvas({
      camera: canvasCamera.camera,
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
