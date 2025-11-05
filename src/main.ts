import { gridViewCanvas, subscriberToGridMap } from "./grid-map"
import { nodesManager, type StickerNode } from "./nodes/stickers"
import { screenToCanvas } from "./point"
import { canvas, context as _context } from "./setup"
import "./index.css"

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

const drawActiveBox = (node: StickerNode) => {
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

  const dots = [
    {
      x: node.x - padding,
      y: node.y - padding,
    },
    {
      x: node.x + node.width + padding,
      y: node.y - padding,
    },
    {
      x: node.x + node.width + padding,
      y: node.y + node.height + padding,
    },
    {
      x: node.x - padding,
      y: node.y + node.height + padding,
    },
  ]

  const baseRadius = 5
  const baseLineWidth = 0.15
  const scalePower = 0.75

  const dotRadius = baseRadius / Math.pow(camera.scale, scalePower)
  const dotLineWidth = baseLineWidth / Math.pow(camera.scale, scalePower)

  dots.forEach((dot) => {
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

const drawStickers = () => {
  if (context === null) return

  context.save()

  nodesManager.nodes.forEach((node) => {
    if (context === null) return

    if (node.isDragging) {
      const worldPosition = screenToCanvas({
        point: pointerPosition,
        camera,
      })

      node.x = worldPosition.x - nodesManager.dragOffset.x
      node.y = worldPosition.y - nodesManager.dragOffset.y
    }

    const canViewShadowAndText = camera.scale >= 0.4

    if (canViewShadowAndText) {
      context.shadowOffsetX = 2
      context.shadowOffsetY = 8
      context.shadowBlur = 16
      context.shadowColor = "#dbdad4"
    }

    context.strokeStyle = node.color
    context.fillStyle = node.color
    context.fillRect(node.x, node.y, node.width, node.height)

    if (node.isSelected) {
      drawActiveBox(node)
    }

    if (canViewShadowAndText) {
      context.font = "22px Roboto"
      context.fillStyle = "#333"
      context.textAlign = "center"
      context.textBaseline = "middle"

      context.fillText(node.text, node.x + node.width / 2, node.y + node.height / 2)
    }

    context.stroke()
  })

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