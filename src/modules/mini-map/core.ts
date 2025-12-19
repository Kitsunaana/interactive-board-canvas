import { inRange, merge } from "lodash"
import { centerPointFromRect, getPointFromEvent, isRectIntersection, screenToCanvas, sizesToPoint, subtractPoint } from "../../point"
import type { LimitMapPoints, Node, Point, Rect, Sizes } from "../../type"
import { getCanvasSizes } from "../../utils"
import type { Camera, CameraState } from "../camera"
import { MINI_MAP_UNSCALE } from "./const"
import { getPointInMiniMap, scaleRect } from "./domain"

export const updateMiniMapSizes = () => {
  const canvasSizes = getCanvasSizes()

  return {
    height: Math.round(canvasSizes.height / MINI_MAP_UNSCALE),
    width: Math.round(canvasSizes.width / MINI_MAP_UNSCALE),
  }
}

export const findLimitMapPoints = ({ nodes, miniMapSizes }: {
  miniMapSizes: Sizes
  nodes: Node[]
}) => (
  nodes.reduce(
    (foundPoints, node) => {
      foundPoints.min.x = Math.min(foundPoints.min.x, node.x + node.width)
      foundPoints.min.y = Math.min(foundPoints.min.y, node.y + node.height)
      foundPoints.max.x = Math.max(foundPoints.max.x, node.x + node.width)
      foundPoints.max.y = Math.max(foundPoints.max.y, node.y + node.height)

      return foundPoints
    },
    {
      max: sizesToPoint(miniMapSizes),
      min: {
        x: nodes[0].x,
        y: nodes[0].y
      },
    } as LimitMapPoints
  )
)

export const calculateUnscaleMap = ({ miniMapSizes, nodes }: {
  miniMapSizes: Sizes
  nodes: Node[]
}) => {
  const foundMapPoints = findLimitMapPoints({ miniMapSizes, nodes })
  const { min, max } = foundMapPoints

  const maxPointX = Math.max(min.x, max.x)
  const maxPointY = Math.max(min.y, max.y)

  const unscaleX = maxPointX / miniMapSizes.width
  const unscaleY = maxPointY / miniMapSizes.height

  return unscaleX > unscaleY ? unscaleX : unscaleY
}

export const computeMiniMapCameraRect = ({ camera, limitMapPoints }: {
  limitMapPoints: LimitMapPoints
  camera: Camera
}): Rect => {
  const viewWorldW = window.innerWidth / camera.scale
  const viewWorldH = window.innerHeight / camera.scale

  const viewWorldX = -camera.x / camera.scale
  const viewWorldY = -camera.y / camera.scale

  const finalX = viewWorldX - limitMapPoints.min.x
  const finalY = viewWorldY - limitMapPoints.min.y

  return {
    height: viewWorldH,
    width: viewWorldW,
    x: finalX,
    y: finalY
  }
}

export const getInitialClickedWorldPoint = ({ downEvent, unscaleMap, limitMapPoints }: {
  limitMapPoints: LimitMapPoints
  downEvent: PointerEvent
  unscaleMap: number
}): Point => {
  const pointInMiniMap = getPointInMiniMap(downEvent)

  const initialWorldX = pointInMiniMap.x * unscaleMap + limitMapPoints.min.x
  const initialWorldY = pointInMiniMap.y * unscaleMap + limitMapPoints.min.y

  return {
    x: initialWorldX,
    y: initialWorldY,
  }
}

export const fromMiniMapToCameraPoisiton = ({
  initialClickedWorldPoint,
  currentLimitMapPoints,
  initialCameraState,
  currentUnscaleMap,
  moveEvent,
}: {
  currentLimitMapPoints: LimitMapPoints
  initialClickedWorldPoint: Point
  initialCameraState: CameraState
  currentUnscaleMap: number
  moveEvent: PointerEvent
}) => {
  const clientRect = (moveEvent.target as HTMLElement).getBoundingClientRect()
  const camera = merge(clientRect, { scale: 1 })
  const point = getPointFromEvent(moveEvent)

  const pointInCanvas = screenToCanvas({
    camera,
    point,
  })

  const worldX = pointInCanvas.x * currentUnscaleMap + currentLimitMapPoints.min.x
  const worldY = pointInCanvas.y * currentUnscaleMap + currentLimitMapPoints.min.y

  const deltaWorldX = worldX - initialClickedWorldPoint.x
  const deltaWorldY = worldY - initialClickedWorldPoint.y

  return {
    ...initialCameraState,
    camera: {
      ...initialCameraState.camera,
      x: initialCameraState.camera.x - deltaWorldX * initialCameraState.camera.scale,
      y: initialCameraState.camera.y - deltaWorldY * initialCameraState.camera.scale,
    }
  }
}

export const canMoveMiniMapViewportRect = ({ miniMapCamera, unscaleMap, downEvent }: {
  downEvent: PointerEvent
  miniMapCamera: Rect
  unscaleMap: number
}) => {
  const unscaledMapViewportRect: Rect = {
    x: miniMapCamera.x / unscaleMap,
    y: miniMapCamera.y / unscaleMap,
    width: miniMapCamera.width / unscaleMap,
    height: miniMapCamera.height / unscaleMap,
  }

  const clientRect = (downEvent.target as HTMLElement).getBoundingClientRect()
  const pointFromEvent = getPointFromEvent(downEvent)

  return isRectIntersection({
    rect: unscaledMapViewportRect,
    point: pointFromEvent,
    camera: {
      x: clientRect.x,
      y: clientRect.y,
      scale: 1
    },
  })
}

export const getMiniMapPointerContext = ({ pointerEvent, unscaleMap, miniMapCamera }: {
  pointerEvent: PointerEvent
  miniMapCamera: Rect
  unscaleMap: number
}) => {
  const pointInMiniMap = getPointInMiniMap(pointerEvent)

  const viewportRect = scaleRect(miniMapCamera, unscaleMap)
  const pointInViewportRect = isRectIntersection({
    point: pointInMiniMap,
    rect: viewportRect,
    camera: {
      x: 0,
      y: 0
    },
  })

  return {
    pointInViewportRect,
    pointInMiniMap,
    viewportRect,
  }
}

export const moveCameraToClickedPoint = ({
  pointInMiniMap,
  viewportRect,
  cameraState,
  unscaleMap,
}: {
  cameraState: CameraState
  pointInMiniMap: Point
  viewportRect: Rect
  unscaleMap: number
}) => {
  const subtractedDistance: Point = {
    y: (pointInMiniMap.y - viewportRect.y - viewportRect.height / 2) * unscaleMap * cameraState.camera.scale,
    x: (pointInMiniMap.x - viewportRect.x - viewportRect.width / 2) * unscaleMap * cameraState.camera.scale,
  }

  const distanceMoveToPoint: Point = {
    x: cameraState.camera.x - subtractedDistance.x,
    y: cameraState.camera.y - subtractedDistance.y,
  }

  return {
    ...cameraState,
    camera: {
      ...cameraState.camera,
      ...distanceMoveToPoint,
    }
  }
}

export const updateCameraWitnAnimation = ({ elapsed, unscaleMap, cameraState, pointInMiniMap, miniMapCamera }: {
  cameraState: CameraState
  pointInMiniMap: Point
  miniMapCamera: Rect
  unscaleMap: number
  elapsed: number
}) => {
  const viewportRectToCenter = centerPointFromRect(scaleRect(miniMapCamera, unscaleMap))
  const displacement = subtractPoint(viewportRectToCenter, pointInMiniMap)

  const range = 3
  
  if (inRange(displacement.x, -range, range) && inRange(displacement.y, -range, range)) return cameraState

  const angle = Math.atan2(displacement.y, displacement.x)
  const tx = -Math.cos(angle) * 10
  const ty = -Math.sin(angle) * 10

  return {
    ...cameraState,
    camera: {
      ...cameraState.camera,
      x: cameraState.camera.x + tx * (elapsed / 100),
      y: cameraState.camera.y + ty * (elapsed / 100),
    }
  }
}
