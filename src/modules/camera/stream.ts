import { isEqual } from "lodash"
import { animationFrames, BehaviorSubject, distinctUntilChanged, filter, finalize, fromEvent, map, merge, scan, shareReplay, startWith, Subject, switchMap, takeUntil, tap, withLatestFrom } from "rxjs"
import { INITIAL_STATE } from "./const"
import { canStartPan, inertiaCameraUpdate, mergeCameraWithUpdatedState, toMovingPanState, toStartPanState, wheelCameraUpdate, type ZoomEvent } from "./core"
import { canvas } from "../../setup"

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

export const wheelCamera$ = merge(wheel$, zoomTrigger$).pipe(
  withLatestFrom(cameraSubject$),
  map(([event, cameraState]) => wheelCameraUpdate({ event, cameraState })),
  shareReplay(1)
)

export const camera$ = merge(wheelCamera$, pan$).pipe(
  startWith(INITIAL_STATE),
  scan(mergeCameraWithUpdatedState),
).subscribe(cameraSubject$)

export const cameraWithInertia$ = animationFrames().pipe(
  withLatestFrom(cameraSubject$, userActivity$),
  scan(
    (acc, [_, currentCamera, isActive]) => (isActive ? currentCamera : inertiaCameraUpdate(acc)),
    INITIAL_STATE
  ),
  distinctUntilChanged(isEqual)
).subscribe(cameraSubject$)
