import { times } from "lodash";
import { BehaviorSubject, combineLatest, map, shareReplay } from "rxjs";
import type { Camera } from "./modules/camera";
import { generateHachureLines, generateLayerOffsets, generateSketchyOutline, getRectBasePoints } from "./modules/node/generate";
import { viewModelState$ } from "./modules/view-model";
import type { Point, Rect } from "./type";
import { CONFIG } from "./modules/node/persist";

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
  variant: "sketch" | "default",

  x: number
  y: number
  id: string
  width: number
  height: number
  colorId: string
}

export const nodes: Node[] = [
  {
    id: "1",
    x: 250,
    y: 250,
    width: 250,
    height: 125,
    type: "sticker",
    variant: "sketch",
    colorId: generateRandomColor(),
  },
  {
    id: "2",
    x: 120,
    y: 120,
    width: 100,
    height: 100,
    type: "sticker",
    variant: "default",
    colorId: generateRandomColor()
  },
  {
    id: "3",
    x: -200,
    y: -200,
    width: 100,
    height: 100,
    type: "sticker",
    variant: "default",
    colorId: generateRandomColor()
  },
  {
    id: "4",
    x: -250,
    y: -300,
    width: 100,
    height: 100,
    type: "sticker",
    variant: "default",
    colorId: generateRandomColor()
  },
  {
    id: "5",
    x: 320,
    y: 2000,
    width: 100,
    height: 70,
    type: "sticker",
    variant: "default",
    colorId: generateRandomColor()
  },
  {
    id: "6",
    x: 3200,
    y: 400,
    width: 100,
    height: 70,
    type: "sticker",
    variant: "default",
    colorId: generateRandomColor()
  }
]

export type NodeRenderSketchVariant = {
  variant: "sketch"

  hachureLines: Point[][]
  layerOffsets: Point[]
  hachureFill: boolean
  strokeColor: string
  outlines: Point[][]
}

export type NodeRenderDefaultVariant = {
  variant: "default"
}

export type NodeRenderVariant = NodeRenderSketchVariant | NodeRenderDefaultVariant

export type NodeToView = Node & NodeRenderVariant & {
  isSelected: boolean
}

export const nodes$ = new BehaviorSubject(nodes)

const generateNodeSketchProps = (node: Node) => {
  const points = getRectBasePoints(node.x, node.y, node.width, node.height)
  const outlines = times(CONFIG.layers).map((index) => generateSketchyOutline(points, index))

  const layerOffsets = generateLayerOffsets(0)
  const hachureLines = generateHachureLines({
    outlinePoints: outlines[0],
    offsetX: layerOffsets[0].x,
    offsetY: layerOffsets[0].y
  })

  return {
    outlines,
    layerOffsets,
    hachureFill: true,
    strokeColor: '#8b5cf6',
    hachureLines: hachureLines,
  }
}

export const nodesToView$ = combineLatest([nodes$, viewModelState$]).pipe(
  map(([nodes, viewModelState]) => ({ viewModelState, nodes })),
  map(({ nodes, viewModelState }) => {
    return nodes.map((node) => {
      return ({
        default: (): NodeToView => ({
          ...node,
          variant: "default",
          isSelected: viewModelState.selectedIds.has(node.id),
        }),
        sketch: (): NodeToView => {
          return {
            ...node,
            variant: "sketch",
            ...generateNodeSketchProps(node),
            isSelected: viewModelState.selectedIds.has(node.id),
          }
        }
      })[node.variant]()
    })
  }),
  shareReplay({ bufferSize: 1, refCount: true })
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
  context.lineWidth = 0.4
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