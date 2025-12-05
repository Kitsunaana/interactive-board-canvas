import type { Point } from "../type"
import { VELOCITY_SCALE, ZOOM, ZOOM_INTENSITY, ZOOM_MAX_SCALE, ZOOM_MIN_SCALE } from "./const"

export type Camera = {
  scale: number
  x: number
  y: number
}

export type DragState = {
  lastPosition: Point
  panOffset: Point
  velocity: Point
  camera: Camera
}

export function toMovingPanState({ moveEvent, dragState }: { 
  moveEvent: PointerEvent; 
  dragState: DragState 
}) {
  return {
    ...dragState,
    camera: {
      ...dragState.camera,
      x: moveEvent.offsetX - dragState.panOffset.x,
      y: moveEvent.offsetY - dragState.panOffset.y,
    },
    pointerPosition: {
      x: moveEvent.offsetX,
      y: moveEvent.offsetY,
    },
    velocity: {
      x: (moveEvent.offsetX - dragState.lastPosition.x) * VELOCITY_SCALE,
      y: (moveEvent.offsetY - dragState.lastPosition.y) * VELOCITY_SCALE,
    },
    lastPosition: {
      x: moveEvent.offsetX,
      y: moveEvent.offsetY,
    },
  }
}

export function toStartPanState({ dragState, startEvent }: {
  startEvent: PointerEvent
  dragState: DragState
}): DragState {
  const { camera } = dragState
  
  return {
    camera,
    panOffset: {
      x: startEvent.offsetX - camera.x,
      y: startEvent.offsetY - camera.y,
    },
    lastPosition: {
      x: startEvent.offsetX,
      y: startEvent.offsetY,
    },
    velocity: {
      x: 0,
      y: 0,
    }
  }
}

export function changeZoom(camera: Camera, event: WheelEvent) {
  const delta = event.deltaY > 0 ? -ZOOM.INTENSITY : ZOOM.INTENSITY
  const newScale = camera.scale * (1 + delta)

  if (newScale < ZOOM.MIN_SCALE || newScale > ZOOM.MAX_SCALE) return camera

  const mouseX = event.offsetX
  const mouseY = event.offsetY

  return {
    x: mouseX - (mouseX - camera.x) * (newScale / camera.scale),
    y: mouseY - (mouseY - camera.y) * (newScale / camera.scale),
    scale: newScale
  }
}

export function canStartPan(event: PointerEvent) {
  return event.button === 1 || (event.button === 0 && event.shiftKey)
}

export function zoomIn(camera: Camera) {
  if (camera.scale >= ZOOM_MAX_SCALE) return camera

  return {
    ...camera,
    scale: camera.scale * (1 + ZOOM_INTENSITY)
  }
}

export function zoomOut(camera: Camera) {
  if (camera.scale <= ZOOM_MIN_SCALE) return camera

  return {
    ...camera,
    scale: camera.scale * (1 - ZOOM_INTENSITY)
  }
}
