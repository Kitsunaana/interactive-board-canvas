import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point.ts";
import { isNotNull } from "@/shared/lib/utils.ts";
import type { Point, Rect } from "@/shared/type/shared";
import * as rx from "rxjs";
import type { NodeBound, NodeCorner, SelectionArea } from "../domain/selection-area";
import { computeSelectionBoundsArea, calcSelectionAreaFromCorner, calcSelectionAreaFromBound } from "../domain/selection-area";
import { camera$ } from "../modules/camera";
import { selectedShapesIds$, viewModel$ } from "./state";

export const pressedResizeHandlerSubject$ = new rx.BehaviorSubject<NodeBound | NodeCorner | null>(null)

const pointerMove$ = rx.fromEvent<PointerEvent>(window, "pointermove")
const pointerDown$ = rx.fromEvent<PointerEvent>(window, "pointerdown")
const pointerUp$ = rx.fromEvent<PointerEvent>(window, "pointerup")

const pressedResizeHandler$: rx.Observable<NodeBound | NodeCorner> = pressedResizeHandlerSubject$.pipe(
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

export const autoSelectionBounds$ = rx.combineLatest([viewModel$.pipe(rx.map((model) => model.nodes))]).pipe(
  rx.map(([shapes]) => computeSelectionBoundsArea(shapes)),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

const mergeWithCurrent = (current: SelectionArea, updated: Partial<Rect>) => ({
  ...current,
  area: {
    ...current.area,
    ...updated,
  }
})


type RecalculateFromBoundParams = {
  initial: SelectionArea
  cursor: Point
}

const manualSelectionBounds$ = rx.combineLatest({
  initialBounds: autoSelectionBounds$.pipe(rx.first(), rx.filter(isNotNull)),
  activeHandler: pressedResizeHandler$
}).pipe(
  rx.map(({ initialBounds, activeHandler }) => ({
    initialBounds,
    recalculateSelectionArea: ({
      bound: (calcSelectionAreaFromBound as Record<string, ((params: RecalculateFromBoundParams) => Partial<Rect>)>),
      corner: (calcSelectionAreaFromCorner as Record<string, ((params: RecalculateFromBoundParams) => Partial<Rect>)>)
    })[activeHandler.type][activeHandler.id]
  })),
  rx.switchMap(({ initialBounds, recalculateSelectionArea }) => pointerMove$.pipe(
    rx.withLatestFrom(
      viewModel$.pipe(rx.map((model) => model.nodes), rx.map(computeSelectionBoundsArea), rx.filter(isNotNull)),
      camera$,
    ),

    rx.map(([moveEvent, currentBounds, camera]) => mergeWithCurrent(currentBounds, recalculateSelectionArea({
      initial: initialBounds,
      cursor: screenToCanvas({
        point: getPointFromEvent(moveEvent),
        camera,
      })
    }))),

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