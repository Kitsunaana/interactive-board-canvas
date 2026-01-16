import { isLeft, left, right } from "@/shared/lib/either.ts";
import { match } from "@/shared/lib/match.ts";
import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point.ts";
import { isNotNull, isNotUndefined } from "@/shared/lib/utils.ts";
import * as rx from "rxjs";
import { recalculateSelectionBoundsFromEdge } from "../../domain/_resize/_recalculate-selection-bounds.ts";
import type { Bound } from "../../domain/_selection/_selection.type.ts";
import { computeSelectionBoundsRect } from "../../domain/_selection/index.ts";
import { shapes$, shapesToView$ } from "../../model/index.ts";
import { camera$ } from "../../modules/_camera/_stream.ts";
import type { ViewModel, ViewModelState } from "./_view-model.type.ts";
import { goToIdle } from "./_view-model.type.ts";

export const viewModelState$ = new rx.BehaviorSubject<ViewModelState>(goToIdle())

export const viewModel$ = rx.combineLatest([viewModelState$, shapesToView$]).pipe(
  rx.map(([state, nodes]) => match(state, {
    nodesDragging: (state): ViewModel => ({
      actions: {},
      nodes: nodes.map((node) => ({
        ...node,
        isSelected: state.selectedIds.has(node.id),
      })),
    }),

    idle: (state): ViewModel => ({
      actions: {},
      nodes: nodes.map((node) => ({
        ...node,
        isSelected: state.selectedIds.has(node.id),
      })),
    }),

    shapesResize: (state): ViewModel => ({
      actions: {},
      nodes: nodes.map((node) => ({
        ...node,
        isSelected: state.selectedIds.has(node.id),
      })),
    }),
  })),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

export const pressedEdgeSubject$ = new rx.BehaviorSubject<Bound | null>(null)

const pressedEdge$ = pressedEdgeSubject$.pipe(rx.filter(edge => isNotNull(edge)), rx.shareReplay({ refCount: true, bufferSize: 1 }))

export const pointerMove$ = rx.fromEvent<PointerEvent>(window, "pointermove")
export const pointerDown$ = rx.fromEvent<PointerEvent>(window, "pointerdown")
export const pointerUp$ = rx.fromEvent<PointerEvent>(window, "pointerup")

export const selectedShapesIds$ = viewModelState$.pipe(
  rx.filter(state => isNotUndefined(state.selectedIds)),
  rx.map(state => state.selectedIds),
  rx.startWith(new Set<string>()),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

export const autoSelectionBounds$ = rx.combineLatest({
  selectedIds: selectedShapesIds$,
  shapes: shapes$,
}).pipe(
  rx.map(({ shapes, selectedIds }) => computeSelectionBoundsRect({ selectedIds, shapes })),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

const isDragging$ = rx.merge(pointerDown$.pipe(rx.map(() => true)), pointerUp$.pipe(rx.map(() => false))).pipe(
  rx.distinctUntilChanged(),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

const isCtrlPressed$ = rx.merge(pointerMove$, pointerDown$, pointerUp$).pipe(
  rx.map(event => event.ctrlKey),
  rx.distinctUntilChanged(),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

isDragging$.subscribe()

const manualSelectionBounds$ = rx.combineLatest({
  initialBounds: autoSelectionBounds$.pipe(rx.first()),
  isDragging: isDragging$,
}).pipe(
  rx.filter(({ isDragging }) => isDragging),

  rx.switchMap(({ initialBounds }) => {
    return pointerMove$.pipe(
      rx.withLatestFrom(
        selectedShapesIds$,
        camera$,
        shapes$,
        pressedEdge$,
      ),

      rx.map(([moveEvent, selectedIds, camera, shapes, activeEdge]) => {
        const cursorInCanvas = screenToCanvas({
          point: getPointFromEvent(moveEvent),
          camera,
        })

        const currentBounds = computeSelectionBoundsRect({
          selectedIds,
          shapes,
        })

        if (isLeft(initialBounds) || isLeft(currentBounds)) return left(null)

        return right(recalculateSelectionBoundsFromEdge[activeEdge.id]({
          first: initialBounds.value,
          current: currentBounds.value,
          cursor: cursorInCanvas,
        }))
      }),

      rx.takeUntil(pointerUp$),
    )
  }),

  rx.shareReplay({ bufferSize: 1, refCount: true })
)

export const selectionBounds$ = rx.combineLatest({
  selectedIds: selectedShapesIds$,
  isCtrl: isCtrlPressed$,
}).pipe(rx.switchMap(({ isCtrl, selectedIds }) => {
  const isManual = isCtrl && selectedIds.size > 1

  return isManual ? manualSelectionBounds$ : autoSelectionBounds$
}))

export const shapesToRecord$ = shapes$.pipe(
  rx.distinctUntilChanged((prev, current) => current.length === prev.length),
  rx.map((nodes) => Object.fromEntries(nodes.map(node => ([node.id, node])))),
)