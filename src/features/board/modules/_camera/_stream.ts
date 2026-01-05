import { canvas } from "@/shared/lib/initial-canvas"
import { _u } from "@/shared/lib/utils"
import { isEqual } from "lodash"
import {
  animationFrames,
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  finalize,
  fromEvent,
  map,
  merge,
  scan,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom
} from "rxjs"
import { INITIAL_STATE } from "./_const"
import {
  canStartPan,
  inertiaCameraUpdate,
  toMovingPanState,
  toStartPanState,
  wheelCameraUpdate,
  zoomIn,
  zoomOut
} from "./_core"
import type { ZoomEvent } from "./_domain"

const pointerLeave$ = fromEvent<PointerEvent>(canvas, "pointerleave")
const pointerDown$ = fromEvent<PointerEvent>(canvas, "pointerdown")
const pointerMove$ = fromEvent<PointerEvent>(canvas, "pointermove")
const pointerUp$ = fromEvent<PointerEvent>(canvas, "pointerup")
const wheel$ = fromEvent<WheelEvent>(canvas, "wheel")

export const zoomTrigger$ = new Subject<ZoomEvent>()

export const gridTypeSubject$ = new BehaviorSubject<"lines" | "dots">("lines")
export const cameraSubject$ = new BehaviorSubject(INITIAL_STATE)

export const activityStart$ = merge(pointerDown$, wheel$, zoomTrigger$).pipe(map(() => true))
export const activityEnd$ = pointerUp$.pipe(map(() => false))

export const userActivity$ = merge(activityStart$, activityEnd$).pipe(
  startWith(false),
  shareReplay(1)
)

export const pan$ = pointerDown$.pipe(
  filter(canStartPan),
  withLatestFrom(cameraSubject$),
  map(([startEvent, dragState]) => toStartPanState({ startEvent, dragState })),

  tap(() => document.documentElement.style.cursor = "grabbing"),

  switchMap((dragState) => (
    pointerMove$.pipe(
      map((moveEvent) => ({ moveEvent, dragState })),
      takeUntil(merge(pointerUp$, pointerLeave$)),
      map(toMovingPanState),

      finalize(() => document.documentElement.style.cursor = "default")
    )
  ))
)

export const wheelCamera$ = merge(
  wheel$.pipe(
    withLatestFrom(cameraSubject$),
    map(([event, cameraState]) => wheelCameraUpdate({ event, cameraState })),
    shareReplay(1)
  ),
  zoomTrigger$.pipe(
    withLatestFrom(cameraSubject$),
    map(([{ __event }, cameraState]) => _u.merge(cameraState, {
      camera: ({ zoomIn, zoomOut })[__event](cameraState.camera)
    }))
  )
)

export const cameraState$ = merge(wheelCamera$, pan$).pipe(
  startWith(INITIAL_STATE),
  scan((camera, updated) => (
    _u.merge(_u.merge(camera, updated), {
      camera: _u.merge(camera.camera, updated.camera)
    })
  )),
)

export const camera$ = cameraSubject$.pipe(map(({ camera }) => camera))

export const cameraWithInertia$ = animationFrames().pipe(
  withLatestFrom(cameraSubject$, userActivity$),
  scan((acc, [_, cameraState, isActive]) => isActive ? cameraState : inertiaCameraUpdate(acc), INITIAL_STATE),
  distinctUntilChanged(isEqual)
)

cameraState$.subscribe(cameraSubject$)
cameraWithInertia$.subscribe(cameraSubject$)
