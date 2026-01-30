import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point.ts";
import { isNotNull } from "@/shared/lib/utils.ts";
import * as rx from "rxjs";
import { calcSelectionAreaFromBound, calcSelectionAreaFromCorner, computeSelectionBoundsArea } from "../domain/selection-area";
import { camera$ } from "../modules/camera";
import type { HitBound, HitCorner } from "../modules/pick-node/_core";
import { selectedShapesIds$, shapesToRender$, viewState$ } from "./state";

export const pressedResizeHandlerSubject$ = new rx.BehaviorSubject<HitBound | HitCorner | null>(null)

const pointerMove$ = rx.fromEvent<PointerEvent>(window, "pointermove")
const pointerDown$ = rx.fromEvent<PointerEvent>(window, "pointerdown")
const pointerUp$ = rx.fromEvent<PointerEvent>(window, "pointerup")

const pressedResizeHandler$: rx.Observable<HitCorner | HitBound> = pressedResizeHandlerSubject$.pipe(
  rx.filter((handler) => isNotNull(handler)),
  rx.shareReplay({ refCount: true, bufferSize: 1 })
)

const isDragging$ = rx.merge(pointerDown$.pipe(rx.map(() => true)), pointerUp$.pipe(rx.map(() => false))).pipe(
  rx.startWith(false),
  rx.distinctUntilChanged(),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

const isCtrlPressed$ = rx.merge(pointerMove$, pointerDown$, pointerUp$).pipe(
  rx.map(event => event.ctrlKey && !event.shiftKey),
  rx.startWith(false),
  rx.distinctUntilChanged(),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

export const autoSelectionBounds$ = rx.combineLatest({
  shapes: shapesToRender$,
  state: viewState$,
}).pipe(
  rx.map(({ shapes, state }) => computeSelectionBoundsArea(shapes, state)),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

export const manualSelectionBounds$ = rx.combineLatest({
  initialBounds: autoSelectionBounds$.pipe(rx.first(), rx.filter(isNotNull)),
  activeHandler: pressedResizeHandler$,
  state: viewState$,
}).pipe(
  rx.map(({ state, initialBounds, activeHandler }) => {
    const recalculateSelectionArea = activeHandler.type === "bound"
      ? calcSelectionAreaFromBound[activeHandler.bound]
      : calcSelectionAreaFromCorner[activeHandler.corner]

    return {
      recalculateSelectionArea,
      initialBounds,
      state,
    }
  }),
  rx.switchMap(({ state, initialBounds, recalculateSelectionArea }) => pointerMove$.pipe(
    rx.withLatestFrom(
      camera$,
      shapesToRender$.pipe(
        rx.map((shapes) => computeSelectionBoundsArea(shapes, state)),
        rx.filter(isNotNull)
      ),
    ),

    rx.map(([moveEvent, camera, currentBounds]) => ({
      ...currentBounds,
      area: {
        ...currentBounds.area,
        ...recalculateSelectionArea({
          initial: initialBounds,
          cursor: screenToCanvas({
            point: getPointFromEvent(moveEvent),
            camera,
          })
        }),
      }
    })),

    rx.takeUntil(pointerUp$),
  )),

  rx.shareReplay({ bufferSize: 1, refCount: true })
)

export const selectionBounds$ = rx.combineLatest({
  selectedIds: selectedShapesIds$,
  isDragging: isDragging$,
  isCtrl: isCtrlPressed$,
}).pipe(
  rx.switchMap(({ isCtrl, isDragging, selectedIds }) => {
    const isManual = isCtrl && isDragging && selectedIds.size > 1

    return isManual ? manualSelectionBounds$ : autoSelectionBounds$
  })
)