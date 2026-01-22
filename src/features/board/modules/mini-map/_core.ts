import { getPointFromEvent, screenToCanvas, subtractPoint } from "@/shared/lib/point"
import { calculateLimitPoints, isRectIntersection, unscaleRect } from "@/shared/lib/rect"
import { _u, getBoundingClientRect, getCanvasSizes } from "@/shared/lib/utils"
import type { LimitPoints, Point, Rect, Sizes } from "@/shared/type/shared"
import type { Camera, CameraState } from "../camera"
import { MINI_MAP_UNSCALE_HEIGHT, MINI_MAP_UNSCALE_WIDTH } from "./_const"
import { getPointInMiniMap } from "./_domain"

export const getUnscaledMiniMapSizes = () => {
  const canvasSizes = getCanvasSizes()

  return {
    height: Math.round(canvasSizes.height / MINI_MAP_UNSCALE_HEIGHT),
    width: Math.round(canvasSizes.width / MINI_MAP_UNSCALE_WIDTH),
  }
}

export const calculateMiniMapCameraRect = ({ camera, limitMapPoints }: {
  limitMapPoints: LimitPoints
  camera: Camera
}): Rect => {
  const minX = Math.abs(limitMapPoints.min.x)
  const minY = Math.abs(limitMapPoints.min.y)

  const viewWorldW = (window.innerWidth) / camera.scale
  const viewWorldH = (window.innerHeight) / camera.scale

  const viewWorldX = -camera.x / camera.scale
  const viewWorldY = -camera.y / camera.scale

  const finalX = viewWorldX + minX
  const finalY = viewWorldY + minY

  return {
    height: viewWorldH,
    width: viewWorldW,
    x: finalX,
    y: finalY
  }
}

export const calculateUnscaleMap = ({ miniMapSizes, rects }: {
  miniMapSizes: Sizes
  rects: Rect[]
}) => {
  const mapPoints = calculateLimitPoints({ rects })
  const { min, max } = mapPoints

  const maxPointX = Math.max(min.x, max.x)
  const maxPointY = Math.max(min.y, max.y)

  const unscaleX = maxPointX / miniMapSizes.width
  const unscaleY = maxPointY / miniMapSizes.height

  return unscaleX > unscaleY ? unscaleX : unscaleY
}

export const getPointFromMiniMapToScreen = ({ downEvent, unscaleMap, limitMapPoints }: {
  limitMapPoints: LimitPoints
  downEvent: PointerEvent
  unscaleMap: number
}): Point => {
  const point = getPointInMiniMap(downEvent)

  const initialWorldX = point.x * unscaleMap + limitMapPoints.min.x
  const initialWorldY = point.y * unscaleMap + limitMapPoints.min.y

  return {
    x: initialWorldX,
    y: initialWorldY,
  }
}

export const fromMiniMapToCameraPosition = ({
  initialClickedWorldPoint,
  currentLimitMapPoints,
  initialCameraState,
  currentUnscaleMap,
  moveEvent,
}: {
  currentLimitMapPoints: LimitPoints
  initialClickedWorldPoint: Point
  initialCameraState: CameraState
  currentUnscaleMap: number
  moveEvent: PointerEvent
}) => {
  const clientRect = getBoundingClientRect(moveEvent)
  const camera = _u.merge(clientRect, { scale: 1 })
  const point = getPointFromEvent(moveEvent)

  const pointInCanvas = screenToCanvas({ camera, point })

  const worldX = pointInCanvas.x * currentUnscaleMap + currentLimitMapPoints.min.x
  const worldY = pointInCanvas.y * currentUnscaleMap + currentLimitMapPoints.min.y

  const deltaWorldX = worldX - initialClickedWorldPoint.x
  const deltaWorldY = worldY - initialClickedWorldPoint.y

  return _u.merge(initialCameraState, {
    camera: _u.merge(initialCameraState.camera, {
      x: initialCameraState.camera.x - deltaWorldX * initialCameraState.camera.scale,
      y: initialCameraState.camera.y - deltaWorldY * initialCameraState.camera.scale,
    })
  })
}

export const canMoveMiniMapViewportRect = ({ miniMapCamera, unscaleMap, downEvent }: {
  downEvent: PointerEvent
  miniMapCamera: Rect
  unscaleMap: number
}) => {
  const unscaledMapViewportRect = unscaleRect(miniMapCamera, unscaleMap)

  const clientRect = getBoundingClientRect(downEvent)
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

  const viewportRect = unscaleRect(miniMapCamera, unscaleMap)
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

  const distanceMoveToPoint = subtractPoint(subtractedDistance, cameraState.camera)

  return _u.merge(cameraState, {
    camera: _u.merge(cameraState.camera, distanceMoveToPoint)
  })
}

export const updateCameraWithAnimation = ({ elapsed, cameraState, displacement }: {
  cameraState: CameraState
  displacement: Point
  elapsed: number
}) => {
  const angle = Math.atan2(displacement.y, displacement.x)
  const tx = -Math.cos(angle) * 10
  const ty = -Math.sin(angle) * 10

  return _u.merge(cameraState, {
    camera: _u.merge(cameraState.camera, {
      x: cameraState.camera.x + tx * (elapsed / 100),
      y: cameraState.camera.y + ty * (elapsed / 100),
    })
  })
}
