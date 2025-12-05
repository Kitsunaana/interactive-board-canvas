import { defer, filter, finalize, fromEvent, map, merge, Observable, scan, shareReplay, startWith, Subject, switchMap, takeUntil, tap, withLatestFrom } from "rxjs"
import { INITIAL_STATE } from "./const"
import { canStartPan, changeZoom, toMovingPanState, toStartPanState, zoomIn, zoomOut, type DragState } from "./domain"

export const camera$: Observable<DragState> = defer(() => {
  const pointerDown$ = fromEvent<PointerEvent>(window, "pointerdown")
  const pointerMove$ = fromEvent<PointerEvent>(window, "pointermove")
  const pointerUp$ = fromEvent<PointerEvent>(window, "pointerup")

  const pan$ = pointerDown$.pipe(
    filter(canStartPan),
    withLatestFrom(camera$),
    map(([startEvent, dragState]) => toStartPanState({ startEvent, dragState })),

    tap(() => document.documentElement.style.cursor = "grabbing"),

    switchMap((dragState) => (
      pointerMove$.pipe(
        map((moveEvent) => ({ moveEvent, dragState })),
        takeUntil(pointerUp$),
        map(toMovingPanState),

        finalize(() => document.documentElement.style.cursor = "default")
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

export const zoomTrigger$ = new Subject<{ __event: "zoomOut" | "zoomIn" }>()

export const wheelCamera$ = merge(fromEvent<WheelEvent>(window, "wheel"), zoomTrigger$)
  .pipe(
    withLatestFrom(camera$),
    map(([event, cameraState]) => ({
      ...INITIAL_STATE,
      camera: event instanceof WheelEvent
        ? changeZoom(cameraState.camera, event)
        : ({ zoomOut, zoomIn })[event.__event](cameraState.camera)
    })),
    shareReplay(1)
  )

