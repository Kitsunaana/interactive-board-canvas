import { emitter } from "../grid-map"
import type { Point } from "../type"
import { Sticker, type StickerToView } from "./sticker"

export class NodesManager {
  private _stickers: Sticker[] = []

  private readonly _dragOffset: Point = {
    x: 0,
    y: 0,
  }

  public constructor(nodes: Sticker[]) {
    this._stickers = nodes

    emitter.on("grid-map:pointer-down", (event) => {
      // this._startNodeDragging.bind(this)(event)

      // this._stickers.forEach(node => {
      //   if (node.canCallMouseDown(event)) {
      //     node.onMouseDown(event)
      //   }
      // })
    })

    emitter.on("grid-map:pointer-move", (event) => { })

    emitter.on("grid-map:pointer-up", (event) => {
      // this._stopNodeDragging.bind(this)(event)

      // this._stickers.forEach(node => {
      //   if (node.canCallMouseUp(event)) {
      //     node.onMouseUp(event)
      //   }
      // })
    })
  }

  public get dragOffset() {
    return this._dragOffset
  }

  public get nodes(): StickerToView[] {
    return this._stickers
  }

  private _stopNodeDragging(_event: PointerEvent) {
    this._state = "idle"

    this._stickers.forEach((node) => {
      // node.isDragging = false
    })
  }

  private _state: "idle" | "dragging" | "selected" = "idle"

  private _startNodeDragging(event: PointerEvent) {
    // const foundNode = this._stickers.find((node) => isRectIntersection({
    //   pointer: subscriberToGridMap.pointerPosition,
    //   camera: subscriberToGridMap.camera,
    //   rect: node.rect,
    // }))

    // if (foundNode !== undefined && this._state === "idle") {
    //   this._stickers.forEach((node) => {
    //     node.isSelected = false
    //   })

    //   this._state = "dragging"

    //   foundNode.isDragging = true
    //   foundNode.isSelected = true

    //   const worldPos = screenToCanvas({
    //     camera: subscriberToGridMap.camera,
    //     point: {
    //       x: event.offsetX,
    //       y: event.offsetY
    //     },
    //   })

    //   this._dragOffset.x = worldPos.x - foundNode.rect.x
    //   this._dragOffset.y = worldPos.y - foundNode.rect.y
    // }
  }

  public addNode(node: Sticker) {
    this._stickers.push(node)
  }

  public removeNode(id: string) {
    this._stickers = this._stickers.filter((node) => node.id !== id)
  }

  public getNode(id: string): Sticker | undefined {
    return this._stickers.find((node) => node.id === id)
  }

  public toggleStickerDraggingState(id: string) {
    const foundSticker = this._stickers.find((node) => node.id === id)

    if (foundSticker) {
      // foundSticker.isDragging = !foundSticker.isDragging
    }
  }

  public toggleStickerSelectionState(id: string) {
    const foundSticker = this._stickers.find((node) => node.id === id)

    if (foundSticker) {
      foundSticker.isSelected = !foundSticker.isSelected
    }
  }
}

const generateRandomSticker = (index: number) => {
  const x = Math.random() * 5000
  const y = Math.random() * 5000
  const width = 100
  const height = 80
  const color = "#fef69e"
  const text = `Hello ${index}`

  return new Sticker({
    x,
    y,
    width,
    height,
    color,
    text
  })
}

const createStickers = (count: number) => {
  return Array.from({ length: count }, (_, index) => generateRandomSticker(index))
}

export const nodesManager = new NodesManager([
  new Sticker({
    text: "Hello",
    color: "#fef69e",
    x: 200,
    y: 200,
    width: 100,
    height: 80,
  }),
  new Sticker({
    text: "World",
    color: "#fef69e",
    x: 420,
    y: 420,
    width: 100,
    height: 80,
  }),
  ...createStickers(0)
])
