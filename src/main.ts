import { gridViewCanvas, subscriberToGridMap } from "./grid-map"
import "./index.css"
import { CanvasRectangle, StickerToDraw, type Sticker } from "./nodes/sticker"
import { nodesManager } from "./nodes/stickers"
import { viewModelContext } from "./nodes/system"
import { context as _context, canvas } from "./setup"

const context = _context as CanvasRenderingContext2D

const pointerPosition = subscriberToGridMap.pointerPosition
const camera = subscriberToGridMap.camera

const toPercentZoom = (scale: number) => {
  return (scale * 100).toFixed(0) + "%"
}

const zoomElement = document.createElement("div")

zoomElement.classList.add("zoom-indicator")
zoomElement.textContent = toPercentZoom(camera.scale)

document.body.appendChild(zoomElement)

const grid = gridViewCanvas

const drawActiveBox = ({ rect: node, activeBoxDots }: Sticker) => {
  const padding = 7

  context.beginPath()
  context.strokeStyle = "#3859ff"
  context.lineWidth = 0.2
  context.moveTo(node.x - padding, node.y - padding)
  context.lineTo(node.x + node.width + padding, node.y - padding)
  context.lineTo(node.x + node.width + padding, node.y + node.height + padding)
  context.lineTo(node.x - padding, node.y + node.height + padding)
  context.lineTo(node.x - padding, node.y - padding)
  context.closePath()
  context.stroke()

  const baseRadius = 5
  const baseLineWidth = 0.15
  const scalePower = 0.75

  const dotRadius = baseRadius / Math.pow(camera.scale, scalePower)
  const dotLineWidth = baseLineWidth / Math.pow(camera.scale, scalePower)

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

console.log(viewModelContext.nodes)

const drawStickers = () => {
  context.save()

  viewModelContext.nodes.forEach((sticker) => {
    sticker.drawSticker(context)
  })

  // if (isDragging) {
  //   const worldPosition = screenToCanvas({
  //     point: pointerPosition,
  //     camera,
  //   })

  //   node.x = worldPosition.x - nodesManager.dragOffset.x
  //   node.y = worldPosition.y - nodesManager.dragOffset.y
  // }

  // if (isSelected) {
  // drawActiveBox(sticker)
  // }

  context.restore()
}

const render = () => {
  if (context === null) return

  requestAnimationFrame(render)
  context.clearRect(0, 0, canvas.width, canvas.height)

  // console.log(subscriberToGridMap.camera)

  context.save()
  context.translate(subscriberToGridMap.camera.x, subscriberToGridMap.camera.y)
  context.scale(subscriberToGridMap.camera.scale, subscriberToGridMap.camera.scale)

  grid.toDrawGrid(context)

  drawStickers()

  context.restore()
}

render()
