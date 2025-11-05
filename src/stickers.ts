type StickerNode = {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: string
  isSelected: boolean
  isDragging: boolean
}

export class NodesManager {
  private _nodes: StickerNode[] = []

  public constructor(nodes: StickerNode[]) {
    this._nodes = nodes
  }

  public get nodes(): StickerNode[] {
    return this._nodes
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

const generateRandomSticker = () => {
  const id = Math.random().toString(36).substring(2, 15)
  const x = Math.random() * 5000
  const y = Math.random() * 5000
  const width = 100
  const height = 80
  const color = "#fef69e"
  const isSelected = false
  const isDragging = false
  return { id, x, y, width, height, color, isSelected, isDragging }
}

const createStickers = (count: number) => {
  return Array.from({ length: count }, generateRandomSticker)
}

export const nodesManager = new NodesManager([
  {
    id: "1",
    x: 20,
    y: 20,
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
    width: 100,
    height: 80,
    color: "#fef69e",
    isSelected: false,
    isDragging: false,
  }
].concat(createStickers(10)))
