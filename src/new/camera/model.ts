import { canvas } from "../../setup"
import type { Camera, Point } from "../../type"

const defaultPoint: Point = {
  x: 0,
  y: 0,
}

const defaultCamera: Camera = {
  scale: 1,
  x: 0,
  y: 0,
}

class CanvasCamera {
  public readonly zoomIntensity = 0.1
  public readonly zoomMinScale = 0.01
  public readonly zoomMaxScale = 10

  public pointerPosition: Point = { ...defaultPoint }
  public panOffset: Point = { ...defaultPoint }
  public camera: Camera = { ...defaultCamera }

  private _isPanning = false

  constructor(private readonly _canvas: HTMLCanvasElement) {
    window.addEventListener("wheel", this._changeZoom.bind(this), { passive: true })

    window.addEventListener("pointerdown", this._startDragging.bind(this))

    window.addEventListener("pointerup", this._stopDragging.bind(this))

    window.addEventListener("pointermove", this._dragging.bind(this))
  }

  private _startDragging(event: PointerEvent) {
    if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
      this._isPanning = true

      this.panOffset.x = event.offsetX - this.camera.x
      this.panOffset.y = event.offsetY - this.camera.y

      this._canvas.style.cursor = "grabbing"
    }
  }

  private _dragging(event: PointerEvent) {
    this.pointerPosition.x = event.offsetX
    this.pointerPosition.y = event.offsetY

    if (this._isPanning) {
      this.camera.x = event.offsetX - this.panOffset.x
      this.camera.y = event.offsetY - this.panOffset.y
    }
  }

  private _stopDragging(_event: PointerEvent) {
    this._isPanning = false

    this._canvas.style.cursor = "default"
  }

  private _changeZoom(event: WheelEvent) {
    const delta = event.deltaY > 0 ? -this.zoomIntensity : this.zoomIntensity
    const newScale = this.camera.scale * (1 + delta)

    if (newScale < this.zoomMinScale || newScale > this.zoomMaxScale) return

    const mouseX = event.offsetX
    const mouseY = event.offsetY

    this.camera.x = mouseX - (mouseX - this.camera.x) * (newScale / this.camera.scale)
    this.camera.y = mouseY - (mouseY - this.camera.y) * (newScale / this.camera.scale)
    this.camera.scale = newScale
  }
}

export const canvasCamera = new CanvasCamera(canvas)

