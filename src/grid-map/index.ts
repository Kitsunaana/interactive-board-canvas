import type { CanvasCamera } from "../new/camera/model"
import { screenToCanvas } from "../point"
import type { Level, ToDrawOneLevel } from "../type"

export class GridToRenderLevels {
  public readonly baseGridSize = 8
  public readonly color = "#dedede"

  public readonly levels: Array<Level> = [
    { size: this.baseGridSize, minScale: 2.0 },
    { size: this.baseGridSize * 2, minScale: 1.0 },
    { size: this.baseGridSize * 4, minScale: 0.5 },
    { size: this.baseGridSize * 8, minScale: 0.25 },
    { size: this.baseGridSize * 16, minScale: 0.125 },
    { size: this.baseGridSize * 32, minScale: 0.0625 },
    { size: this.baseGridSize * 64, minScale: 0.03125 },
    { size: this.baseGridSize * 128, minScale: 0.015625 },
    { size: this.baseGridSize * 256, minScale: 0.0078125 },
    { size: this.baseGridSize * 512, minScale: 0.00390625 },
    { size: this.baseGridSize * 1024, minScale: 0.001953125 },
    { size: this.baseGridSize * 2048, minScale: 0 },
  ]

  constructor(private readonly _canvasCamera: CanvasCamera) { }

  public toDrawOneLevel: ToDrawOneLevel = ({ endWorld, startWorld, level }) => {
    const isScaleSmallerThanLevel = this._canvasCamera.camera.scale < level.minScale

    if (isScaleSmallerThanLevel) return null

    const fadeProgress = this._getFadeProgress(level)

    if (fadeProgress <= 0) return null

    const startX = Math.floor(startWorld.x / level.size) * level.size
    const startY = Math.floor(startWorld.y / level.size) * level.size
    const endX = Math.ceil(endWorld.x / level.size) * level.size
    const endY = Math.ceil(endWorld.y / level.size) * level.size

    const opacity = fadeProgress * 0.5
    const strokeStyle = this.color + Math.floor(opacity * 255).toString(16).padStart(2, '0')
    const lineWidth = 1 / this._canvasCamera.camera.scale

    return {
      strokeStyle,
      lineWidth,
      startX,
      startY,
      endX,
      endY,
    }
  }

  private _getNextLevelMinScale(level: Level) {
    return this.levels[this.levels.indexOf(level) - 1]?.minScale || level.minScale * 2
  }

  private _getFadeProgress(level: Level) {
    const nextLevelMinScale = this._getNextLevelMinScale(level)
    const fadeRange = nextLevelMinScale - level.minScale
    return Math.min(1, Math.max(0, (this._canvasCamera.camera.scale - level.minScale) / fadeRange))
  }
}

export class GridViewCanvas {
  constructor(
    private readonly _gridToRenderLevels: GridToRenderLevels,
    private readonly _canvas: HTMLCanvasElement,
    private readonly _canvasCamera: CanvasCamera
  ) { }

  toDrawGrid(context: CanvasRenderingContext2D) {
    context.save()

    const startPoint = {
      x: 0,
      y: 0,
    }

    const endPoint = {
      x: this._canvas.width,
      y: this._canvas.height,
    }

    const startWorld = screenToCanvas({
      camera: this._canvasCamera.camera,
      point: startPoint,
    })

    const endWorld = screenToCanvas({
      camera: this._canvasCamera.camera,
      point: endPoint,
    })

    const renderLevel = (level: Level) => {
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
    }

    this._gridToRenderLevels.levels.forEach(renderLevel)

    context.restore()
  }
}


