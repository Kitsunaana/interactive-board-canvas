import { canvas, resize$ } from "@/shared/lib/initial-canvas"
import { getCanvasSizes } from "@/shared/lib/utils"
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
import { getWorldPoints, type ZoomAction } from "./_domain"

const pointerLeave$ = rx.fromEvent<PointerEvent>(canvas, "pointerleave")
const pointerDown$ = rx.fromEvent<PointerEvent>(canvas, "pointerdown")
const pointerMove$ = rx.fromEvent<PointerEvent>(canvas, "pointermove")
const pointerUp$ = rx.fromEvent<PointerEvent>(canvas, "pointerup")
const wheel$ = rx.fromEvent<WheelEvent>(canvas, "wheel")

export const zoomTrigger$ = new rx.Subject<ZoomAction>()

export const gridTypeSubject$ = new rx.BehaviorSubject<"lines" | "dots">("lines")
export const cameraSubject$ = new rx.BehaviorSubject(INITIAL_STATE)

const activityStart$ = rx.merge(pointerDown$, wheel$, zoomTrigger$).pipe(rx.map(() => true))
const activityEnd$ = pointerUp$.pipe(rx.map(() => false))

const userActivity$ = rx.merge(activityStart$, activityEnd$).pipe(
  rx.startWith(false),
  rx.shareReplay(1)
)

export const camera$ = cameraSubject$.pipe(rx.map(({ camera }) => camera))

const pan$ = pointerDown$.pipe(
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

const wheelCamera$ = wheel$.pipe(
  rx.withLatestFrom(camera$),
  rx.map(([event, camera]) => changeZoom(camera, event)),
  rx.shareReplay(1)
)

const animateZoom$ = zoomTrigger$.pipe(rx.withLatestFrom(camera$), rx.switchMap(([{ action }, camera]) => (
  rx.animationFrames().pipe(
    rx.scan((acc) => ({ zoomIn, zoomOut })[action](acc, 0.05), camera),
    rx.takeUntil(rx.timer(100))
  )
)))

const cameraWithInertia$ = rx.animationFrames().pipe(
  rx.withLatestFrom(cameraSubject$, userActivity$),
  rx.map(([_, cameraState, isActive]) => ({ cameraState, isActive })),
  rx.pairwise(),
  rx.map(([prev, current]) => ({ prev, current })),
  rx.scan((acc, { current, prev }) => {
    const prevX = prev.cameraState.camera.x
    const currentX = current.cameraState.camera.x

    const prevY = prev.cameraState.camera.y
    const currentY = current.cameraState.camera.y

    const notNeedApplyInertia = currentX === prevX && currentY === prevY

    return (current.isActive || notNeedApplyInertia) ? current.cameraState : inertiaCameraUpdate(acc)
  }, INITIAL_STATE),
  rx.distinctUntilChanged(_.isEqual)
)

pan$.subscribe(cameraSubject$)
cameraWithInertia$.subscribe(cameraSubject$)

wheelCamera$.subscribe((camera) => cameraSubject$.next({ ...cameraSubject$.getValue(), camera }))
animateZoom$.subscribe((camera) => cameraSubject$.next({ ...cameraSubject$.getValue(), camera }))

export const canvasSizes$ = resize$.pipe(
  rx.map(getCanvasSizes),
  rx.startWith(getCanvasSizes()),
  rx.tap((canvasSizes) => Object.assign(canvas, canvasSizes)),
)

export const canvasSegment$ = rx.combineLatest({ camera: camera$, sizes: canvasSizes$ }).pipe(rx.map(getWorldPoints))
