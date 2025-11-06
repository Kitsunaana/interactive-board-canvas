import { subscriberToGridMap } from "../grid-map"
import { isRectIntersection } from "../point"
import type { Rect } from "../type"

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

  constructor(public readonly rect: Rect) {
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

export type StickerToView = {
  id: string
  text: string
  color: string

  rect: Rect

  isSelected: boolean

  onMouseUp?: (event: PointerEvent) => void
  onMouseDown?: (event: PointerEvent) => void
}

export class StickerToDraw extends CanvasRectangle {
  constructor(public sticker: StickerToView) {
    super(sticker.rect)

    this.onMouseDown = sticker.onMouseDown
    this.onMouseUp = sticker.onMouseUp
  }

  public drawSticker(context: CanvasRenderingContext2D) {
    const canViewShadowAndText = subscriberToGridMap.camera.scale >= 0.4

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
