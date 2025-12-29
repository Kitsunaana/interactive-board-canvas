import { BehaviorSubject, combineLatest, map } from "rxjs";
import type { Camera } from "./modules/camera";
import { viewModelState$ } from "./modules/view-model";
import type { Rect } from "./type";

export const toRGB = (red: number, green: number, blue: number) => {
  return `rgb(${red},${green},${blue})`
}

const generateRandomColor = () => {
  const red = Math.trunc(Math.random() * 255)
  const green = Math.trunc(Math.random() * 255)
  const blue = Math.trunc(Math.random() * 255)

  return toRGB(red, green, blue)
}

export type Node = {
  type: "sticker"

  x: number
  y: number
  id: string
  width: number
  height: number
  colorId: string
}

export const nodes: Node[] = [
  {
    type: "sticker",
    id: "1",
    x: -200,
    y: -200,
    width: 100,
    height: 100,
    colorId: generateRandomColor(),
  },
  {
    type: "sticker",
    id: "2",
    x: -150,
    y: -150,
    width: 100,
    height: 100,
    colorId: generateRandomColor()
  },
  {
    type: "sticker",
    id: "3",
    x: 200,
    y: 200,
    width: 100,
    height: 100,
    colorId: generateRandomColor()
  },
  {
    type: "sticker",
    id: "4",
    x: 250,
    y: 300,
    width: 100,
    height: 100,
    colorId: generateRandomColor()
  },
  {
    type: "sticker",
    id: "5",
    x: 320,
    y: 2000,
    width: 100,
    height: 70,
    colorId: generateRandomColor()
  },
  {
    type: "sticker",
    id: "6",
    x: 3200,
    y: 400,
    width: 100,
    height: 70,
    colorId: generateRandomColor()
  }
]

export type NodeToView = Node & {
  isSelected: boolean
}

export const nodes$ = new BehaviorSubject(nodes)

export const nodesToView$ = combineLatest([nodes$, viewModelState$]).pipe(
  map(([nodes, viewModelState]) => {
    return nodes.map((node): NodeToView => ({
      ...node,
      isSelected: viewModelState.selectedIds.has(node.id),
    }))
  })
)

const PADDING = 7

const BASE_RADIUS = 5
const SCALE_POWER = 0.75

type ActiveBoxDotsParams = {
  camera: Camera
  rect: Rect
}

export const getActiveBoxDots = ({ rect, camera }: ActiveBoxDotsParams) => [
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x - PADDING,
    y: rect.y - PADDING,
  },
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x + rect.width + PADDING,
    y: rect.y - PADDING,
  },
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x + rect.width + PADDING,
    y: rect.y + rect.height + PADDING,
  },
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x - PADDING,
    y: rect.y + rect.height + PADDING,
  },
]

export const drawActiveBox = ({ context, rect, camera, activeBoxDots }: {
  activeBoxDots: ReturnType<typeof getActiveBoxDots>
  context: CanvasRenderingContext2D
  camera: Camera
  rect: Rect
}) => {
  const padding = 7

  context.beginPath()
  context.strokeStyle = "#314cd9"
  context.lineWidth = 0.2
  context.moveTo(rect.x - padding, rect.y - padding)
  context.lineTo(rect.x + rect.width + padding, rect.y - padding)
  context.lineTo(rect.x + rect.width + padding, rect.y + rect.height + padding)
  context.lineTo(rect.x - padding, rect.y + rect.height + padding)
  context.lineTo(rect.x - padding, rect.y - padding)
  context.closePath()
  context.stroke()

  const baseLineWidth = 0.45
  const scalePower = 0.75
  const baseRadius = 5

  const dotLineWidth = baseLineWidth / Math.pow(camera.scale, scalePower)
  const dotRadius = baseRadius / Math.pow(camera.scale, scalePower)

  context.save()
  context.fillStyle = "#ffffff"
  context.strokeStyle = "#aaaaaa"

  activeBoxDots.forEach((dot) => {
    context.beginPath()
    context.lineWidth = dotLineWidth
    context.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2)
    context.fill()
    context.stroke()
    context.closePath()
  })

  context.restore()
}