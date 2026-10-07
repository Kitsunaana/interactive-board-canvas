import {Point, type PointData} from "../../maths";

export const VELOCITY_SCALE = 1.0
export const FRICTION = 0.90

export const ZOOM_INTENSITY = 0.1
export const ZOOM_MIN_SCALE = 0.01
export const ZOOM_MAX_SCALE = 10

export class CameraModel {
  public lastPosition: Point | null = null
  
  private _panOffset = Point.zero()
  private _velocity = Point.zero()

  public isDragging: boolean = false
  
  public position = Point.zero()
  public zoom: number = 1

  public handleUp(_position: PointData): void {
    this.lastPosition = null
    this.isDragging = false
  }

  public handleStart(position: PointData): void {
    this.isDragging = true
    
    const offset = new Point(position.x, position.y)
    const delta = offset.sub(this.position)

    this._panOffset = delta
    this.lastPosition = offset

    this._velocity.set(0, 0)
  }

  public handleMove(position: PointData): void {
    const offset = new Point(position.x, position.y)
    const delta = offset.sub(this.lastPosition!).scale(VELOCITY_SCALE)

    this._velocity.copyFrom(delta)
    this.lastPosition!.copyFrom(offset)
    this.position.copyFrom(offset.sub(this._panOffset))
  }

  public handleChangeZoom(event: WheelEvent): void {
    const delta = event.deltaY > 0 ? -ZOOM_INTENSITY : ZOOM_INTENSITY
    const newScale = this.zoom * (1 + delta)

    if (newScale < ZOOM_MIN_SCALE || newScale > ZOOM_MAX_SCALE) return

    const mouse = new Point(event.offsetX, event.offsetY)
    const nextTranslate = mouse.sub(
      mouse
        .sub(this.position)
        .scale(newScale / this.zoom)
    )

    this.position.copyFrom(nextTranslate)
    this.zoom = newScale
  }

  public update(): void {
    if (this.isDragging) return
    const hasVelocity = Math.hypot(this._velocity.x, this._velocity.y) > 0.01

    if (hasVelocity) {
      this.position.copyFrom(this.position.add(this._velocity))
      this._velocity.copyFrom(this._velocity.scale(FRICTION))
    }
  }
}
