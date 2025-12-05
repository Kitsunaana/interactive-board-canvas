import { defer, filter, finalize, fromEvent, map, merge, Observable, scan, shareReplay, startWith, switchMap, takeUntil, tap, withLatestFrom } from "rxjs"
import { defaultPoint } from "../../to_remove/model"
import type { Camera, Point } from "../type"

export type StartDraggingReturn = {
  lastPosition: Point
  panOffset: Point
  velocity: Point
  camera: Camera
}

const VELOCITY_SCALE = 0.35

const ZOOM = {
  INTENSITY: 0.1,
  MIN_SCALE: 0.01,
  MAX_SCALE: 10,
}

const INITIAL_CAMERA: Camera = {
  scale: 1,
  x: 0,
  y: 0,
}

const INITIAL_LAST_POSITION = { ...defaultPoint }
const INITIAL_PAN_OFFSET = { ...defaultPoint }
const INITIAL_VELOCITY = { ...defaultPoint }

const INITIAL_STATE = {
  lastPosition: INITIAL_LAST_POSITION,
  panOffset: INITIAL_PAN_OFFSET,
  velocity: INITIAL_VELOCITY,
  camera: INITIAL_CAMERA,
}

export const camera$: Observable<StartDraggingReturn | { camera: Camera }> = defer(() => {
  const pointerDown$ = fromEvent<PointerEvent>(window, "pointerdown")
  const pointerMove$ = fromEvent<PointerEvent>(window, "pointermove")
  const pointerUp$ = fromEvent<PointerEvent>(window, "pointerup")
  const wheel$ = fromEvent<WheelEvent>(window, "wheel")

  const wheelCamera$ = wheel$.pipe(
    withLatestFrom(camera$),
    map(([event, camera]) => ({
      camera: changeZoom(camera.camera, event)
    })),
  )

  const pan$ = pointerDown$.pipe(
    filter(canStartPan),
    withLatestFrom(camera$),
    map(toStartPanState),

    tap(() => {
      document.documentElement.style.cursor = "grabbing"
    }),

    switchMap((dragState) => (
      pointerMove$.pipe(
        map((moveEvent) => ({ moveEvent, dragState })),
        takeUntil(pointerUp$),
        map(toMovingPanState),
        finalize(() => {
          document.documentElement.style.cursor = "default"
        })
      )
    ))
  )

  return merge(wheelCamera$, pan$)
    .pipe(
      startWith(INITIAL_STATE),
      scan((camera, updated) => ({
        ...camera,
        ...updated,
        camera: {
          ...camera.camera,
          ...updated.camera,
        }
      })),
      shareReplay(1)
    )
}).pipe(shareReplay(1))

function toMovingPanState({ moveEvent, dragState }: { moveEvent: PointerEvent; dragState: StartDraggingReturn }) {
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

function toStartPanState([startEvent, { camera }]: [PointerEvent, { camera: Camera }]): StartDraggingReturn {
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

function changeZoom(camera: Camera, event: WheelEvent) {
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

function canStartPan(event: PointerEvent) {
  return event.button === 1 || (event.button === 0 && event.shiftKey)
}