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

export const pointerMove$ = rx.fromEvent<PointerEvent>(window, "pointermove")
export const pointerDown$ = rx.fromEvent<PointerEvent>(window, "pointerdown")
export const pointerUp$ = rx.fromEvent<PointerEvent>(window, "pointerup")

export const selectedShapesIds$ = viewModelState$.pipe(
  rx.filter(state => isNotUndefined(state.selectedIds)),
  rx.map(state => state.selectedIds),
  rx.startWith(new Set<string>())
)

export const autoSelectionBounds$ = rx.combineLatest({
  selectedIds: selectedShapesIds$,
  shapes: shapes$,
}).pipe(
  rx.map(({ shapes, selectedIds }) => computeSelectionBoundsRect({ selectedIds, shapes })),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

const manualSelectionBounds$ = pointerDown$.pipe(
  rx.withLatestFrom(viewModelState$),
  rx.filter(([, state]) => state.type === "idle" && state.selectedIds.size >= 2),
  rx.switchMap(() => {
    return pointerMove$.pipe(
      rx.filter(event => event.ctrlKey),

      rx.withLatestFrom(
        selectedShapesIds$,
        camera$,
        shapes$,
        autoSelectionBounds$.pipe(rx.first()),
        pressedEdgeSubject$.pipe(rx.filter(edge => isNotNull(edge)))
      ),

      rx.map(([moveEvent, selectedIds, camera, shapes, initialBounds, activeEdge]) => {
        const cursorInCanvas = screenToCanvas({
          point: getPointFromEvent(moveEvent),
          camera,
        })

        const currentBounds = computeSelectionBoundsRect({
          selectedIds,
          shapes,
        })

        if (isLeft(initialBounds) || isLeft(currentBounds)) return left(null)

        const params = {
          first: initialBounds.value,
          current: currentBounds.value,
          cursor: cursorInCanvas,
        }

        return right(
          match(activeEdge, {
            bottom: () => recalculateSelectionBoundsFromEdge.bottom(params),
            right: () => recalculateSelectionBoundsFromEdge.right(params),
            left: () => recalculateSelectionBoundsFromEdge.left(params),
            top: () => recalculateSelectionBoundsFromEdge.top(params),
          }, "id")
        )
      }),

      rx.takeUntil(pointerUp$),
    )
  }),

  rx.shareReplay({ bufferSize: 1, refCount: true })
)

const isCtrlPressed$ = rx.merge(pointerMove$, pointerDown$, pointerUp$).pipe(rx.map(event => event.ctrlKey), rx.startWith(false))

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