import { gridViewCanvas, subscriberToGridMap } from "./grid-map"
import "./index.css"
import { nodesManager } from "./nodes/stickers"
import { screenToCanvas } from "./point"
import { canvas, context } from "./setup"

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

const drawStickers = () => {
  if (context === null) return

  context.save()

  nodesManager.nodes.forEach(node => {
    if (context === null) return

    if (node.isDragging) {
      const worldPosition = screenToCanvas({
        point: pointerPosition,
        camera,
      })

      node.x = worldPosition.x - nodesManager.dragOffset.x
      node.y = worldPosition.y - nodesManager.dragOffset.y
    }

    if (camera.scale >= 0.4) {
      context.shadowOffsetX = 2
      context.shadowOffsetY = 8
      context.shadowBlur = 16
      context.shadowColor = "#dbdad4"
    }

    context.strokeStyle = node.color
    context.fillStyle = node.color
    context.fillRect(node.x, node.y, node.width, node.height)
    context.stroke()
  })

  context.restore()
}

const render = () => {
  if (context === null) return

  requestAnimationFrame(render)
  context.clearRect(0, 0, canvas.width, canvas.height)

  context.save()
  context.translate(subscriberToGridMap.camera.x, subscriberToGridMap.camera.y)
  context.scale(subscriberToGridMap.camera.scale, subscriberToGridMap.camera.scale)

  grid.toDrawGrid(context)

  drawStickers()

  context.restore()
}

render()