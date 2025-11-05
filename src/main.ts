import { nodesManager } from "./stickers"
import "./index.css"
import type { Level, ToDrawOneLevel } from "./type"
import { gridViewCanvas, subscriberToGridMap } from "./grid-map"
import { canvas, context } from "./setup"

const POINTER_POSITION = {
  x: 0,
  y: 0,
}

const DRAG_OFFSET = {
  x: 0,
  y: 0,
}

const CAMERA = {
  scale: 1,
  x: 0,
  y: 0,
}

let isPanning = false

const PAN_OFFSET = {
  x: 0,
  y: 0,
}

type Rect = {
  height: number
  width: number
  x: number
  y: number
}

const isRectIntersection = (rect: Rect) => {
  // const worldPosition = screenToCanvas(POINTER_POSITION.x, POINTER_POSITION.y)

  // return (
  //   worldPosition.x >= rect.x && worldPosition.x <= rect.x + rect.width &&
  //   worldPosition.y >= rect.y && worldPosition.y <= rect.y + rect.height
  // )
}

window.addEventListener("pointerdown", (event) => {
  handleDrggingMap(event)
  handleClickingNode(event)
})

function handleClickingNode(event: PointerEvent) {
  // const foundNodeClicked = nodesManager.nodes.find(isRectIntersection)

  // if (foundNodeClicked !== undefined) {
  //   foundNodeClicked.isDragging = true

  //   const worldPos = screenToCanvas(event.offsetX, event.offsetY)

  //   DRAG_OFFSET.x = worldPos.x - foundNodeClicked.x
  //   DRAG_OFFSET.y = worldPos.y - foundNodeClicked.y
  // }
}

function handleDrggingMap(event: PointerEvent) {
  // if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
  //   isPanning = true

  //   PAN_OFFSET.x = event.offsetX - CAMERA.x
  //   PAN_OFFSET.y = event.offsetY - CAMERA.y

  //   canvas.style.cursor = "grabbing"

  //   return
  // }
}

window.addEventListener("pointerup", () => {
  // isPanning = false
  // canvas.style.cursor = "default"

  // nodesManager.nodes.forEach(node => {
  //   node.isDragging = false
  // })
})

window.addEventListener("pointermove", (event) => {
  POINTER_POSITION.x = event.offsetX
  POINTER_POSITION.y = event.offsetY

  if (isPanning) {
    CAMERA.x = event.offsetX - PAN_OFFSET.x
    CAMERA.y = event.offsetY - PAN_OFFSET.y
  }
})

const ZOOM_INTENSITY = 0.1
const ZOOM_MIN_SCALE = 0.01
const ZOOM_MAX_SCALE = 10

window.addEventListener("wheel", handleZoomingMap, { passive: true })

const toPercentZoom = (scale: number) => {
  return (scale * 100).toFixed(0) + "%"
}

const zoomElement = document.createElement("div")

zoomElement.classList.add("zoom-indicator")
zoomElement.textContent = toPercentZoom(CAMERA.scale)

document.body.appendChild(zoomElement)

function handleZoomingMap(event: WheelEvent) {
  const delta = event.deltaY > 0 ? -ZOOM_INTENSITY : ZOOM_INTENSITY
  const newScale = CAMERA.scale * (1 + delta)

  if (newScale < ZOOM_MIN_SCALE || newScale > ZOOM_MAX_SCALE) return

  const mouseX = event.offsetX
  const mouseY = event.offsetY

  CAMERA.x = mouseX - (mouseX - CAMERA.x) * (newScale / CAMERA.scale)
  CAMERA.y = mouseY - (mouseY - CAMERA.y) * (newScale / CAMERA.scale)
  CAMERA.scale = newScale

  zoomElement.textContent = toPercentZoom(CAMERA.scale)
}

// class GridView {
//   private readonly _baseGridSize = 8
//   private readonly _color = "#e5e5e5"

//   private readonly _levels: Array<Level> = [
//     { size: this._baseGridSize, minScale: 2.0 },
//     { size: this._baseGridSize * 2, minScale: 1.0 },
//     { size: this._baseGridSize * 4, minScale: 0.5 },
//     { size: this._baseGridSize * 8, minScale: 0.25 },
//     { size: this._baseGridSize * 16, minScale: 0.125 },
//     { size: this._baseGridSize * 32, minScale: 0.0625 },
//     { size: this._baseGridSize * 64, minScale: 0.03125 },
//     { size: this._baseGridSize * 128, minScale: 0.015625 },
//     { size: this._baseGridSize * 256, minScale: 0.0078125 },
//     { size: this._baseGridSize * 512, minScale: 0.00390625 },
//     { size: this._baseGridSize * 1024, minScale: 0.001953125 },
//     { size: this._baseGridSize * 2048, minScale: 0 },
//   ]

//   public get levels() {
//     return this._levels
//   }

//   public toDrawOneLevel: ToDrawOneLevel = ({ endWorld, startWorld, level }) => {
//     const isScaleSmallerThanLevel = CAMERA.scale < level.minScale

//     if (isScaleSmallerThanLevel) return null

//     const fadeProgress = this._getFadeProgress(level)

//     if (fadeProgress <= 0) return null

//     const startX = Math.floor(startWorld.x / level.size) * level.size
//     const startY = Math.floor(startWorld.y / level.size) * level.size
//     const endX = Math.ceil(endWorld.x / level.size) * level.size
//     const endY = Math.ceil(endWorld.y / level.size) * level.size

//     const opacity = fadeProgress * 0.5
//     const strokeStyle = this._color + Math.floor(opacity * 255).toString(16).padStart(2, '0')
//     const lineWidth = 1 / CAMERA.scale

//     return {
//       strokeStyle,
//       lineWidth,
//       startX,
//       startY,
//       endX,
//       endY,
//     }
//   }

//   private _getNextLevelMinScale(level: typeof this._levels[number]) {
//     return this._levels[this._levels.indexOf(level) - 1]?.minScale || level.minScale * 2
//   }

//   private _getFadeProgress(level: typeof this._levels[number]) {
//     const nextLevelMinScale = this._getNextLevelMinScale(level)
//     const fadeRange = nextLevelMinScale - level.minScale
//     return Math.min(1, Math.max(0, (CAMERA.scale - level.minScale) / fadeRange))
//   }
// }

const grid = gridViewCanvas

// class GridViewBridge {
//   constructor(private readonly _gridView: GridView) { }

//   toDrawGrid(context: CanvasRenderingContext2D) {
//     context.save()

//     const startWorld = screenToCanvas(0, 0)
//     const endWorld = screenToCanvas(canvas.width, canvas.height)

//     this._gridView.levels.forEach(level => {
//       const result = this._gridView.toDrawOneLevel({
//         startWorld,
//         endWorld,
//         level
//       })

//       if (result === null) return

//       const { strokeStyle, lineWidth, startX, startY, endX, endY } = result

//       context.strokeStyle = strokeStyle
//       context.lineWidth = lineWidth

//       for (let x = startX; x <= endX; x += level.size) {
//         context.beginPath()
//         context.moveTo(x, startY)
//         context.lineTo(x, endY)
//         context.stroke()
//       }

//       for (let y = startY; y <= endY; y += level.size) {
//         context.beginPath()
//         context.moveTo(startX, y)
//         context.lineTo(endX, y)
//         context.stroke()
//       }
//     })

//     context.restore()
//   }
// }

// const gridViewBridge = new GridViewBridge(grid)

// const drawStickers = () => {
//   context.save()

//   nodesManager.nodes.forEach(node => {
//     if (node.isDragging) {
//       const worldPosition = screenToCanvas(POINTER_POSITION.x, POINTER_POSITION.y)

//       node.x = worldPosition.x - DRAG_OFFSET.x
//       node.y = worldPosition.y - DRAG_OFFSET.y
//     }

//     if (CAMERA.scale >= 0.4) {
//       context.shadowOffsetX = 2
//       context.shadowOffsetY = 8
//       context.shadowBlur = 16
//       context.shadowColor = "#dbdad4"
//     }

//     context.strokeStyle = node.color
//     context.fillStyle = node.color
//     context.fillRect(node.x, node.y, node.width, node.height)
//     context.stroke()
//   })

//   context.restore()
// }

const render = () => {
  if (context === null) return

  requestAnimationFrame(render)
  context.clearRect(0, 0, canvas.width, canvas.height)

  context.save()
  context.translate(subscriberToGridMap.camera.x, subscriberToGridMap.camera.y)
  context.scale(subscriberToGridMap.camera.scale, subscriberToGridMap.camera.scale)

  grid.toDrawGrid(context)
  // gridViewBridge.toDrawGrid(context)

  // drawStickers()

  context.restore()
}

render()