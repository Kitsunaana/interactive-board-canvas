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

    window.addEventListener("pointerdown", this._startNodeDragging.bind(this))
    window.addEventListener("pointerup", this._stopNodeDragging.bind(this))
  }

  public get dragOffset() {
    return this._dragOffset
  }

  public get nodes(): StickerToView[] {
    return this._stickers
  }

  private _stopNodeDragging(_event: PointerEvent) {
  }

  private _startNodeDragging(event: PointerEvent) {
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
  }

  public toggleStickerSelectionState(id: string) {
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
  // new Sticker({
  //   text: "World",
  //   color: "#fef69e",
  //   x: 420,
  //   y: 420,
  //   width: 100,
  //   height: 80,
  // }),
  ...createStickers(0)
])
