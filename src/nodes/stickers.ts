import { emitter, subscriberToGridMap } from "../grid-map"
import { isRectIntersection, screenToCanvas } from "../point"
import type { Point } from "../type"

type StickerNode = {
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

export class NodesManager {
  private _nodes: StickerNode[] = []

  private readonly _dragOffset: Point = {
    x: 0,
    y: 0,
  }

  public constructor(nodes: StickerNode[]) {
    this._nodes = nodes

    emitter.on("grid-map:pointer-down", this._startNodeDragging.bind(this))
    emitter.on("grid-map:pointer-up", this._stopNodeDragging.bind(this))
  }

  public get dragOffset() {
    return this._dragOffset
  }

  public get nodes(): StickerNode[] {
    return this._nodes
  }

  private _stopNodeDragging(_event: PointerEvent) {
    this._nodes.forEach((node) => {
      node.isDragging = false
    })
  }

  private _startNodeDragging(event: PointerEvent) {
    const foundNode = this._nodes.find((node) => isRectIntersection({
      pointer: subscriberToGridMap.pointerPosition,
      camera: subscriberToGridMap.camera,
      rect: node,
    }))

    if (foundNode !== undefined) {
      foundNode.isDragging = true

      const worldPos = screenToCanvas({
        camera: subscriberToGridMap.camera,
        point: {
          x: event.offsetX,
          y: event.offsetY
        },
      })

      this._dragOffset.x = worldPos.x - foundNode.x
      this._dragOffset.y = worldPos.y - foundNode.y
    }
  }

  public addNode(node: StickerNode) {
    this._nodes.push(node)
  }

  public removeNode(id: string) {
    this._nodes = this._nodes.filter((node) => node.id !== id)
  }

  public getNode(id: string): StickerNode | undefined {
    return this._nodes.find((node) => node.id === id)
  }

  public toggleStickerDraggingState(id: string) {
    const foundSticker = this._nodes.find((node) => node.id === id)

    if (foundSticker) {
      foundSticker.isDragging = !foundSticker.isDragging
    }
  }

  public toggleStickerSelectionState(id: string) {
    const foundSticker = this._nodes.find((node) => node.id === id)

    if (foundSticker) {
      foundSticker.isSelected = !foundSticker.isSelected
    }
  }
}

const generateRandomSticker = (index: number) => {
  const id = Math.random().toString(36).substring(2, 15)
  const x = Math.random() * 5000
  const y = Math.random() * 5000
  const width = 100
  const height = 80
  const color = "#fef69e"
  const text = `Hello ${index}`
  const isSelected = false
  const isDragging = false
  return { id, x, y, width, height, color, text, isSelected, isDragging }
}

const createStickers = (count: number) => {
  return Array.from({ length: count }, (_, index) => generateRandomSticker(index))
}

export const nodesManager = new NodesManager([
  {
    id: "1",
    x: 20,
    y: 20,
    text: "Hello",
    width: 100,
    height: 80,
    color: "#fef69e",
    isSelected: false,
    isDragging: false,
  },
  {
    id: "2",
    x: 120,
    y: 120,
    text: "World",
    width: 100,
    height: 80,
    color: "#fef69e",
    isSelected: false,
    isDragging: false,
  }
].concat(createStickers(10)))
