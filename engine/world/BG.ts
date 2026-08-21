import { LayerV2 } from "../LayerV2";
import { Point } from "../maths";

export const VELOCITY_SCALE = 1.0
export const FRICTION = 0.90

export const ZOOM_INTENSITY = 0.1
export const ZOOM_MIN_SCALE = 0.01
export const ZOOM_MAX_SCALE = 10

export const BASE_GRID_SIZE = 12
export const COLOR = "#e6e6e6"

export type Level = {
  size: number
  minScale: number
}

type LevelRenderProps = {
  level: Level
  color: string
  width: number
  start: Point
  end: Point
}

export class Background extends LayerV2 {
  private static LEVELS: Array<Level> = [
    { size: BASE_GRID_SIZE, minScale: 2.0 },
    { size: BASE_GRID_SIZE * 2, minScale: 1.0 },
    { size: BASE_GRID_SIZE * 4, minScale: 0.5 },
    { size: BASE_GRID_SIZE * 8, minScale: 0.25 },
    { size: BASE_GRID_SIZE * 16, minScale: 0.125 },
    { size: BASE_GRID_SIZE * 32, minScale: 0.0625 },
    { size: BASE_GRID_SIZE * 64, minScale: 0.03125 },
    { size: BASE_GRID_SIZE * 128, minScale: 0.015625 },
    { size: BASE_GRID_SIZE * 256, minScale: 0.0078125 },
    { size: BASE_GRID_SIZE * 512, minScale: 0.00390625 },
    { size: BASE_GRID_SIZE * 1024, minScale: 0.001953125 },
    { size: BASE_GRID_SIZE * 2048, minScale: 0 },
  ]

  private static getNextLevelMinScale(level: Level) {
    const index = Background.LEVELS.indexOf(level) - 1
    return Background.LEVELS[index]?.minScale || level.minScale * 2
  }

  private _position = Point.zero()
  private _zoom: number = 1

  private _lastPosition = Point.zero()
  private _panOffset = Point.zero()
  private _velocity = Point.zero()

  public constructor() {
    super()

    this.bindEvents()
    // this.subscribe(this)

    window.addEventListener("wheel", (event) => {
      this._handleChangeZoom(event)
    })
  }

  public onProcess(event: PointerEvent): void {
    this._handleMovePan(event)
  }

  public onFinish(event: PointerEvent): void {

  }

  public onStart(event: PointerEvent): void {
    this._handleStartPan(event)
  }

  public update(): void {
    const hasVelocity = Math.hypot(this._velocity.x, this._velocity.y) > 0.01

    if (hasVelocity && this.isDragging === false) {
      this._position.copyFrom(this._position.add(this._velocity))
      this._velocity.copyFrom(this._velocity.scale(FRICTION))
    }
  }

  private _applyCameraToContext(context: CanvasRenderingContext2D) {
    context.setTransform(
      this._zoom,
      0,
      0,
      this._zoom,
      this._position.x,
      this._position.y,
    )
  }

  public tracePath(context: CanvasRenderingContext2D) {
    const gridProps = this._getVisibleGridProps()

    this._applyCameraToContext(context)

    gridProps.forEach(({ level, color, width, start, end }) => {
      context.strokeStyle = color
      context.lineWidth = width

      for (let x = start.x; x <= end.x; x += level.size) {
        context.beginPath()
        context.moveTo(x, start.y)
        context.lineTo(x, end.y)
        context.stroke()
      }

      for (let y = start.y; y <= end.y; y += level.size) {
        context.beginPath()
        context.moveTo(start.x, y)
        context.lineTo(end.x, y)
        context.stroke()
      }
    })
  }

  public render(): void {
    const context = this.getContext()
    const hitContext = this.getHitContext()
    const sizes = this.sizes()

    context.clearRect(0, 0, sizes.width, sizes.height)

    context.save()
    this.tracePath(context)
    this.children().forEach((child) => {
      child.render(context)
      child.renderHit(hitContext)
    })
    context.restore()
  }

  public renderHit(): void {
    const context = this.getHitContext()
    const sizes = this.sizes()

    context.clearRect(0, 0, sizes.width, sizes.height)

    context.save()
    context.fillStyle = this.getHitColor(this)
    context.fillRect(0, 0, sizes.width, sizes.height)
    this._applyCameraToContext(context)
    this.children().forEach((child) => child.renderHit(context))
    context.restore()
  }

  public screenToWorld(point: Point): Point {
    return point
      .sub(this._position)
      .div(new Point(this._zoom, this._zoom))
  }

  private _handleStartPan(event: PointerEvent): void {
    const offset = new Point(event.offsetX, event.offsetY)
    const delta = offset.sub(this._position)

    this._panOffset.copyFrom(delta)
    this._lastPosition.copyFrom(offset)

    this._velocity.set(0, 0)
  }

  private _handleMovePan(event: PointerEvent): void {
    const offset = new Point(event.offsetX, event.offsetY)
    const delta = offset.sub(this._lastPosition).scale(VELOCITY_SCALE)

    this._velocity.copyFrom(delta)
    this._lastPosition.copyFrom(offset)
    this._position.copyFrom(offset.sub(this._panOffset))
  }

  private _handleChangeZoom(event: WheelEvent): void {
    const delta = event.deltaY > 0 ? -ZOOM_INTENSITY : ZOOM_INTENSITY
    const newScale = this._zoom * (1 + delta)

    if (newScale < ZOOM_MIN_SCALE || newScale > ZOOM_MAX_SCALE) return

    const mouse = new Point(event.offsetX, event.offsetY)
    
    
    const nextTranslate = mouse.sub(
      mouse
      .sub(this._position)
      .scale(newScale / this._zoom)
    )
    
    this._position.copyFrom(nextTranslate)
    this._zoom = newScale
  }

  private _getVisibleWorldBounds(): [Point, Point] {
    return [
      this.screenToWorld(Point.zero()),
      this.screenToWorld(Point.fromSize(this.sizes())),
    ]
  }

  private _getVisibleGridProps(): Array<LevelRenderProps> {
    return Background.LEVELS
      .map(this._resolveLevelRenderProps.bind(this))
      .filter(props => props !== null)
  }

  private _calculateFadeProgress(level: Level): number {
    const nextLevelMinScale = Background.getNextLevelMinScale(level)
    const fadeRange = nextLevelMinScale - level.minScale

    return Math.min(1, Math.max(0, (this._zoom - level.minScale) / fadeRange))
  }

  private _resolveLevelRenderProps(level: Level): LevelRenderProps | null {
    if (this._zoom < level.minScale) return null
    const fadeProgress = this._calculateFadeProgress(level)
    if (fadeProgress <= 0) return null

    return this._buildLevelRenderProps(level, fadeProgress)
  }

  private _buildLevelRenderProps(level: Level, fadeProgress: number): LevelRenderProps {
    const [startWorld, endWorld] = this._getVisibleWorldBounds()

    const size = new Point(level.size, level.size)

    const start = startWorld.div(size).floor().scale(level.size)
    const end = endWorld.div(size).ceil().scale(level.size)

    const opacity = fadeProgress * 0.5
    const color = COLOR + Math.floor(opacity * 255).toString(16).padStart(2, '0')
    const width = 1 / this._zoom

    return {
      level,
      color,
      width,
      start,
      end,
    }
  }
}