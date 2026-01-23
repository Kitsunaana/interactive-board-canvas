import { _u } from "@/shared/lib/utils";
import {
  FRICTION,
  MIN_VELOCITY,
  VELOCITY_SCALE,
  ZOOM,
  ZOOM_INTENSITY,
  ZOOM_MAX_SCALE,
  ZOOM_MIN_SCALE
} from "./_const";
import type { Camera, CameraState } from "./_domain";

export const canStartPan = (event: PointerEvent, spacePressed: boolean) => {
  return (event.button === 1 && event.ctrlKey === false) || (spacePressed && event.button === 0)
}

export const zoomIn = (camera: Camera, intensity = ZOOM_INTENSITY) => {
  if (camera.scale >= ZOOM_MAX_SCALE) return camera

  return _u.merge(camera, {
    scale: camera.scale * (1 + intensity)
  })
}

export const zoomOut = (camera: Camera, intensity = ZOOM_INTENSITY) => {
  if (camera.scale <= ZOOM_MIN_SCALE) return camera

  return _u.merge(camera, {
    scale: camera.scale * (1 - intensity)
  })
}

export const toMovingPanState = ({ moveEvent, dragState }: {
  moveEvent: PointerEvent;
  dragState: CameraState
}) => _u.merge(dragState, {
  camera: _u.merge(dragState.camera, {
    x: moveEvent.offsetX - dragState.panOffset.x,
    y: moveEvent.offsetY - dragState.panOffset.y,
  }),
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

export const inertiaCameraUpdate = (cameraState: CameraState) => {
  const velocityMagnitude = Math.hypot(cameraState.velocity.x, cameraState.velocity.y)

  if (velocityMagnitude > MIN_VELOCITY) {
    return _u.merge(cameraState, {
      camera: _u.merge(cameraState.camera, {
        x: cameraState.camera.x + cameraState.velocity.x,
        y: cameraState.camera.y + cameraState.velocity.y,
      }),
      velocity: _u.merge(cameraState.velocity, {
        x: cameraState.velocity.x * FRICTION,
        y: cameraState.velocity.y * FRICTION,
      })
    })
  }

  return _u.merge(cameraState, {
    velocity: {
      x: 0,
      y: 0,
    }
  })
}

export const inertiaCameraUpdateV = (cameraState: CameraState) => {
  const velocityMagnitude = Math.hypot(cameraState.velocity.x, cameraState.velocity.y)

  if (velocityMagnitude > MIN_VELOCITY) {
    return _u.merge(cameraState, {
      camera: _u.merge(cameraState.camera, {
        x: cameraState.camera.x + cameraState.velocity.x,
        y: cameraState.camera.y + cameraState.velocity.y,
      }),
      velocity: _u.merge(cameraState.velocity, {
        x: cameraState.velocity.x * FRICTION,
        y: cameraState.velocity.y * FRICTION,
      })
    })
  }

  return _u.merge(cameraState, {
    velocity: {
      x: 0,
      y: 0,
    }
  })
}