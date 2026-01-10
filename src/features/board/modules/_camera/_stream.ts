import { canvas } from "@/shared/lib/initial-canvas"
import { _u } from "@/shared/lib/utils"
import * as _ from "lodash"
import * as rx from "rxjs"
import { INITIAL_STATE } from "./_const"
import {
  canStartPan,
  changeZoom,
  inertiaCameraUpdate,
  toMovingPanState,
  toStartPanState,
  zoomIn,
  zoomOut
} from "./_core"
import type { ZoomAction } from "./_domain"

const pointerLeave$ = rx.fromEvent<PointerEvent>(canvas, "pointerleave")
const pointerDown$ = rx.fromEvent<PointerEvent>(canvas, "pointerdown")
const pointerMove$ = rx.fromEvent<PointerEvent>(canvas, "pointermove")
const pointerUp$ = rx.fromEvent<PointerEvent>(canvas, "pointerup")
const wheel$ = rx.fromEvent<WheelEvent>(canvas, "wheel")

export const zoomTrigger$ = new rx.Subject<ZoomAction>()

export const gridTypeSubject$ = new rx.BehaviorSubject<"lines" | "dots">("lines")
export const cameraSubject$ = new rx.BehaviorSubject(INITIAL_STATE)

export const activityStart$ = rx.merge(pointerDown$, wheel$, zoomTrigger$).pipe(rx.map(() => true))
export const activityEnd$ = pointerUp$.pipe(rx.map(() => false))

export const userActivity$ = rx.merge(activityStart$, activityEnd$).pipe(
  rx.startWith(false),
  rx.shareReplay(1)
)

export const pan$ = pointerDown$.pipe(
  rx.filter(canStartPan),
  rx.withLatestFrom(cameraSubject$),
  rx.map(([startEvent, dragState]) => toStartPanState({ startEvent, dragState })),

  rx.tap(() => document.documentElement.style.cursor = "grabbing"),

  rx.switchMap((dragState) => (
    pointerMove$.pipe(
      rx.map((moveEvent) => ({ moveEvent, dragState })),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
      rx.map(toMovingPanState),

      rx.finalize(() => document.documentElement.style.cursor = "default")
    )
  ))
)

export const wheelCamera$ = rx.merge(
  wheel$.pipe(
    rx.withLatestFrom(cameraSubject$),
    rx.map(([event, cameraState]) => _u.merge(cameraState, { camera: changeZoom(cameraState.camera, event) })),
    rx.shareReplay(1)
  ),
  zoomTrigger$.pipe(
    rx.withLatestFrom(cameraSubject$),
    rx.map(([{ action: __event }, cameraState]) => _u.merge(cameraState, {
      camera: ({ zoomIn, zoomOut })[__event](cameraState.camera)
    }))
  )
)

export const cameraState$ = rx.merge(wheelCamera$, pan$).pipe(
  rx.startWith(INITIAL_STATE),
  rx.scan((camera, updated) => (
    _u.merge(_u.merge(camera, updated), {
      camera: _u.merge(camera.camera, updated.camera)
    })
  )),
)

export const camera$ = cameraSubject$.pipe(rx.map(({ camera }) => camera))

export const cameraWithInertia$ = rx.animationFrames().pipe(
  rx.withLatestFrom(cameraSubject$, userActivity$),
  rx.scan((acc, [_, cameraState, isActive]) => isActive ? cameraState : inertiaCameraUpdate(acc), INITIAL_STATE),
  rx.distinctUntilChanged(_.isEqual)
)

cameraState$.subscribe(cameraSubject$)
cameraWithInertia$.subscribe(cameraSubject$)
