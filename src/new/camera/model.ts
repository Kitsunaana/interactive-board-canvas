import type { Camera, Point } from "../../type"
import mitt from "mitt"

export const defaultPoint: Point = {
  x: 0,
  y: 0,
}

const defaultCamera: Camera = {
  scale: 1,
  x: 0,
  y: 0,
}

export type CameraEvents = {
  "change-zoom": Camera
  "zoom-in": void
  "zoom-out": void
}

export const cameraEmitter = mitt<CameraEvents>()

export class Vector {
  constructor(public x: number, public y: number) { }

  public add(vector: Vector) {
    this.x += vector.x
    this.y += vector.y
  }
}

export class CanvasCamera {
  public readonly zoomIntensity = 0.1
  public readonly zoomMinScale = 0.01
  public readonly zoomMaxScale = 10

  public pointerPosition: Point = { ...defaultPoint }
  public panOffset: Point = { ...defaultPoint }
  public camera: Camera = { ...defaultCamera }

  private _isPanning = false

  private readonly _canvas: HTMLCanvasElement = (
    document.getElementById("canvas") as HTMLCanvasElement
  )

  constructor(private readonly __canvas: HTMLCanvasElement) {
    window.addEventListener("wheel", this._changeZoom.bind(this), { passive: true })
    window.addEventListener("pointerdown", this._startDragging.bind(this))
    window.addEventListener("pointerup", this._stopDragging.bind(this))
    window.addEventListener("pointermove", this._dragging.bind(this))

    cameraEmitter.on("zoom-out", this._zoomOut.bind(this))
    cameraEmitter.on("zoom-in", this._zoomIn.bind(this))
  }

  private _zoomIn() {
    if (this.camera.scale >= this.zoomMaxScale) return

    this.camera.scale *= 1 + this.zoomIntensity
    cameraEmitter.emit("change-zoom", this.camera)
  }

  private _zoomOut() {
    if (this.camera.scale <= this.zoomMinScale) return

    this.camera.scale *= 1 - this.zoomIntensity
    cameraEmitter.emit("change-zoom", this.camera)
  }

  private _startDragging(event: PointerEvent) {
    if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
      this._isPanning = true

      this.panOffset.x = event.offsetX - this.camera.x
      this.panOffset.y = event.offsetY - this.camera.y

      // this._canvas.style.cursor = "grabbing"

      this._lastPosition.x = event.offsetX
      this._lastPosition.y = event.offsetY

      this._velocity.x = 0
      this._velocity.y = 0
    }
  }

  private _dragging(event: PointerEvent) {
    this.pointerPosition.x = event.offsetX
    this.pointerPosition.y = event.offsetY

    if (this._isPanning) {
      this._velocity.x = (event.offsetX - this._lastPosition.x) * this._velocityScale
      this._velocity.y = (event.offsetY - this._lastPosition.y) * this._velocityScale

      this._lastPosition.x = event.offsetX
      this._lastPosition.y = event.offsetY

      this.camera.x = event.offsetX - this.panOffset.x
      this.camera.y = event.offsetY - this.panOffset.y
    }
  }

  private _lastPosition = new Vector(0, 0)
  private _velocity = new Vector(0, 0)

  private _velocityScale = 0.35
  private _friction = 0.9
  private _minVelocity = 0.01

  public update() {
    if (!this._isPanning) {
      const velocityMagnitude = Math.sqrt(this._velocity.x ** 2 + this._velocity.y ** 2)

      if (velocityMagnitude > this._minVelocity) {
        this.camera.x += this._velocity.x
        this.camera.y += this._velocity.y

        this._velocity.x *= this._friction
        this._velocity.y *= this._friction
      } else {
        this._velocity.x = 0
        this._velocity.y = 0
      }
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

    cameraEmitter.emit("change-zoom", this.camera)
  }
}
