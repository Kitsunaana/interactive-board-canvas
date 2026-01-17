import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point.ts";
import { isNotNull } from "@/shared/lib/utils.ts";
import * as rx from "rxjs";
import { recalculateSelectionBoundsFromEdge } from "../domain/_selection-bounds.ts";
import type { Edge } from "../domain/_selection/_selection.type.ts";
import { computeSelectionBoundsArea } from "../domain/_selection/index.ts";
import { camera$ } from "../modules/_camera/_stream.ts";
import { selectedShapesIds$, viewModel$ } from "./state/_view-model";

export const pressedEdgeSubject$ = new rx.BehaviorSubject<Edge | null>(null)

const pressedEdge$ = pressedEdgeSubject$.pipe(
  rx.filter(edge => isNotNull(edge)),
  rx.shareReplay({ refCount: true, bufferSize: 1 })
)

export const pointerMove$ = rx.fromEvent<PointerEvent>(window, "pointermove")
export const pointerDown$ = rx.fromEvent<PointerEvent>(window, "pointerdown")
export const pointerUp$ = rx.fromEvent<PointerEvent>(window, "pointerup")

const isDragging$ = rx.merge(pointerDown$.pipe(rx.map(() => true)), pointerUp$.pipe(rx.map(() => false))).pipe(
  rx.startWith(false),
  rx.distinctUntilChanged(),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

const isCtrlPressed$ = rx.merge(pointerMove$, pointerDown$, pointerUp$).pipe(
  rx.map(event => event.ctrlKey),
  rx.startWith(false),
  rx.distinctUntilChanged(),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

export const autoSelectionBounds$ = rx.combineLatest([viewModel$.pipe(rx.map((model) => model.nodes))]).pipe(
  rx.map(([shapes]) => computeSelectionBoundsArea(shapes)),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

const manualSelectionBounds$ = rx.combineLatest({
  initialBounds: autoSelectionBounds$.pipe(rx.first(), rx.filter(isNotNull)),
}).pipe(
  rx.switchMap(({ initialBounds }) => pointerMove$.pipe(
    rx.withLatestFrom(
      viewModel$.pipe(rx.map((model) => model.nodes), rx.map(computeSelectionBoundsArea), rx.filter(isNotNull)),
      pressedEdge$,
      camera$,
    ),

    rx.map(([moveEvent, currentBounds, activeEdge, camera]) => {
      return recalculateSelectionBoundsFromEdge[activeEdge.id]({
        first: initialBounds,
        current: currentBounds,
        cursor: screenToCanvas({
          point: getPointFromEvent(moveEvent),
          camera,
        }),
      })
    }),

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