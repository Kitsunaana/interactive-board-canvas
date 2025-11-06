import { subscriberToGridMap } from "../grid-map"
import { isRectIntersection } from "../point"
import type { Point, Rect } from "../type"

export type StickerNode = {
  id: string
  x: number
  y: number
  text: string
  color: string
  width: number
  height: number
  isSelected: boolean
  isDragging: boolean
}

const PADDING = 7

export class CanvasRectangle {
  public onMouseDown?: (event: PointerEvent) => void
  public onMouseUp?: (event: PointerEvent) => void

  constructor(private readonly rect: Rect) {
    window.addEventListener("pointerdown", (event) => {
      if (this._canCallMouseDown.call(this, event)) {
        this.onMouseDown?.call(this, event)
      }
    })

    window.addEventListener("pointerup", (event) => {
      if (this._canCallMouseUp.call(this, event)) {
        this.onMouseUp?.call(null, event)
      }
    })
  }

  private _canCallMouseDown(event: PointerEvent) {
    return isRectIntersection({
      camera: subscriberToGridMap.camera,
      rect: this.rect,
      pointer: {
        x: event.offsetX,
        y: event.offsetY,
      },
    })
  }

  private _canCallMouseUp(event: PointerEvent) {
    return isRectIntersection({
      camera: subscriberToGridMap.camera,
      rect: this.rect,
      pointer: {
        x: event.offsetX,
        y: event.offsetY,
      },
    })
  }
}

const drawActiveBox = (context: CanvasRenderingContext2D, { rect, activeBoxDots }: Sticker) => {
  const padding = 7

  context.beginPath()
  context.strokeStyle = "#3859ff"
  context.lineWidth = 0.2
  context.moveTo(rect.x - padding, rect.y - padding)
  context.lineTo(rect.x + rect.width + padding, rect.y - padding)
  context.lineTo(rect.x + rect.width + padding, rect.y + rect.height + padding)
  context.lineTo(rect.x - padding, rect.y + rect.height + padding)
  context.lineTo(rect.x - padding, rect.y - padding)
  context.closePath()
  context.stroke()

  const baseRadius = 5
  const baseLineWidth = 0.15
  const scalePower = 0.75

  const dotRadius = baseRadius / Math.pow(subscriberToGridMap.camera.scale, scalePower)
  const dotLineWidth = baseLineWidth / Math.pow(subscriberToGridMap.camera.scale, scalePower)

  activeBoxDots.forEach((dot) => {
    if (context === null) return

    context.beginPath()
    context.fillStyle = "#ffffff"
    context.strokeStyle = "#aaaaaa"
    context.lineWidth = dotLineWidth
    context.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2)
    context.fill()
    context.closePath()
    context.stroke()
  })
}

export type StickerToView = {
  id: string
  text: string
  color: string
  rect: Rect
  isSelected: boolean

  get activeBoxDots(): Point[]
}

export class StickerToDraw extends CanvasRectangle {
  constructor(public sticker: StickerToView) {
    super(sticker.rect)
  }

  public drawSticker(context: CanvasRenderingContext2D) {
    const canViewShadowAndText = subscriberToGridMap.camera.scale >= 0.4

    if (this.sticker.isSelected) {
      drawActiveBox(context, this.sticker)
    }

    if (canViewShadowAndText) this._drawShadow(context)

    this._drawBackground(context)

    if (canViewShadowAndText) this._drawText(context)
  }

  private _drawBackground(context: CanvasRenderingContext2D) {
    const { color, rect } = this.sticker

    context.strokeStyle = color
    context.fillStyle = color
    context.fillRect(rect.x, rect.y, rect.width, rect.height)
    context.stroke()
  }

  private _drawShadow(context: CanvasRenderingContext2D) {
    context.shadowOffsetX = 2
    context.shadowOffsetY = 8
    context.shadowBlur = 16
    context.shadowColor = "#dbdad4"
  }

  private _drawText(context: CanvasRenderingContext2D) {
    const { text, rect } = this.sticker

    context.font = "22px Roboto"
    context.fillStyle = "#333"
    context.textAlign = "center"
    context.textBaseline = "middle"

    context.fillText(text, rect.x + rect.width / 2, rect.y + rect.height / 2)
  }
}

export class Sticker implements StickerToView {
  public id: string = crypto.randomUUID()

  public rect!: Rect

  public text: string = ""
  public color: string = "#fef69e"

  public isSelected: boolean = false

  constructor({ text, color, ...rect }: Rect & {
    color: string
    text: string
  }) {
    Object.assign(this, { color, text, rect })
  }

  public get activeBoxDots() {
    return [
      {
        x: this.rect.x - PADDING,
        y: this.rect.y - PADDING,
      },
      {
        x: this.rect.x + this.rect.width + PADDING,
        y: this.rect.y - PADDING,
      },
      {
        x: this.rect.x + this.rect.width + PADDING,
        y: this.rect.y + this.rect.height + PADDING,
      },
      {
        x: this.rect.x - PADDING,
        y: this.rect.y + this.rect.height + PADDING,
      },
    ]
  }
}
