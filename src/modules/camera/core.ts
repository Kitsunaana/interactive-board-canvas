import { screenToCanvas } from "../../point"
import type { Point, Sizes } from "../../type"
import { VELOCITY_SCALE, ZOOM, INITIAL_STATE, MIN_VELOCITY, FRICTION, ZOOM_MAX_SCALE, ZOOM_INTENSITY, ZOOM_MIN_SCALE, START_POINT } from "./const"

export type Camera = {
  scale: number
  x: number
  y: number
}

export type CameraState = {
  lastPosition: Point
  panOffset: Point
  velocity: Point
  camera: Camera
}

export type ZoomEvent = {
  __event: "zoomIn" | "zoomOut"
}

export const toMovingPanState = ({ moveEvent, dragState }: {
  moveEvent: PointerEvent;
  dragState: CameraState
}) => ({
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
})

export const toStartPanState = ({ dragState, startEvent }: {
  startEvent: PointerEvent
  dragState: CameraState
}): CameraState => ({
  camera: dragState.camera,
  panOffset: {
    x: startEvent.offsetX - dragState.camera.x,
    y: startEvent.offsetY - dragState.camera.y,
  },
  lastPosition: {
    x: startEvent.offsetX,
    y: startEvent.offsetY,
  },
  velocity: {
    x: 0,
    y: 0,
  }
})

export const changeZoom = (camera: Camera, event: WheelEvent) => {
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

export const mergeCameraWithUpdatedState = (camera: CameraState, updated: CameraState) => ({
  ...camera,
  ...updated,
  camera: {
    ...camera.camera,
    ...updated.camera,
  }
})

export const wheelCameraUpdate = ({ cameraState, event }: {
  event: WheelEvent | ZoomEvent
  cameraState: CameraState
}) => ({
  ...INITIAL_STATE,
  camera: event instanceof WheelEvent
    ? changeZoom(cameraState.camera, event)
    : ({ zoomIn, zoomOut })[event.__event](cameraState.camera)
})

export const inertiaCameraUpdate = (cameraState: CameraState) => {
  const velocityMagnitude = Math.hypot(cameraState.velocity.x, cameraState.velocity.y)

  if (velocityMagnitude > MIN_VELOCITY) {
    return {
      ...cameraState,
      camera: {
        ...cameraState.camera,
        x: cameraState.camera.x + cameraState.velocity.x,
        y: cameraState.camera.y + cameraState.velocity.y,
      },
      velocity: {
        ...cameraState.velocity,
        x: cameraState.velocity.x * FRICTION,
        y: cameraState.velocity.y * FRICTION,
      }
    }
  }

  return {
    ...cameraState,
    velocity: {
      x: 0,
      y: 0,
    }
  }
}

export const canStartPan = (event: PointerEvent) => {
  return event.button === 1 || (event.button === 0 && event.shiftKey)
}

export const zoomIn = (camera: Camera) => {
  if (camera.scale >= ZOOM_MAX_SCALE) return camera

  return {
    ...camera,
    scale: camera.scale * (1 + ZOOM_INTENSITY)
  }
}

export const zoomOut = (camera: Camera) => {
  if (camera.scale <= ZOOM_MIN_SCALE) return camera

  return {
    ...camera,
    scale: camera.scale * (1 - ZOOM_INTENSITY)
  }
}

export const sizesToPoint = (sizes: Sizes): Point => {
  return {
    y: sizes.height,
    x: sizes.width,
  }
}

export const getWorldPoints = ({ sizes, state }: {
  state: CameraState
  sizes: Sizes
}) => ({
  sizes,
  startWorld: screenToCanvas({
    camera: state.camera,
    point: START_POINT,
  }),
  endWorld: screenToCanvas({
    point: sizesToPoint(sizes),
    camera: state.camera,
  }),
})