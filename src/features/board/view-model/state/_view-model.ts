import { isLeft, isRight, left, right } from "@/shared/lib/either.ts";
import { match } from "@/shared/lib/match.ts";
import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point.ts";
import { isNotNull, isNotUndefined } from "@/shared/lib/utils.ts";
import * as rx from "rxjs";
import { recalculateSelectionBoundsFromEdge, type RecalculateFromEdgeParams } from "../../domain/_resize/_recalculate-selection-bounds.ts";
import type { Bound } from "../../domain/_selection/_selection.type.ts";
import { computeSelectionBoundsRect } from "../../domain/_selection/index.ts";
import type { ShapeToView } from "../../domain/_shape.ts";
import { shapes$, shapesToView$ } from "../../model/index.ts";
import { camera$ } from "../../modules/_camera/_stream.ts";
import type { ViewModel, ViewModelState } from "./_view-model.type.ts";
import { goToIdle } from "./_view-model.type.ts";
import { isNull } from "lodash";

export const viewModelState$ = new rx.BehaviorSubject<ViewModelState>(goToIdle())

export const viewModel$ = rx.combineLatest([viewModelState$, shapesToView$]).pipe(
  rx.map(([state, nodes]) => match(state, {
    nodesDragging: (state): ViewModel => ({
      actions: {},
      nodes: nodes.map((node) => ({
        ...node,
        isSelected: state.selectedIds.has(node.id),
      }) as ShapeToView),
    }),

    idle: (state): ViewModel => ({
      actions: {},
      nodes: nodes.map((node) => ({
        ...node,
        isSelected: state.selectedIds.has(node.id),
      }) as ShapeToView),
    }),

    shapesResize: (state): ViewModel => ({
      actions: {},
      nodes: nodes.map((node) => ({
        ...node,
        isSelected: state.selectedIds.has(node.id),
      }) as ShapeToView),
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

const multiSelectionResizeFromEdge$ = pointerMove$.pipe(
  rx.filter(state => state.ctrlKey),
  rx.withLatestFrom(
    selectedShapesIds$,
    pressedEdgeSubject$.pipe(rx.filter((pressedEdge) => isNotNull(pressedEdge))),
    camera$,
    shapes$,
    shapes$.pipe(
      rx.first(),
      rx.withLatestFrom(selectedShapesIds$),
      rx.map(([shapes, selectedIds]) => computeSelectionBoundsRect({ shapes, selectedIds })),
      rx.filter(selectionBounds => isRight(selectionBounds)),
    ),
  ),
  rx.map(([pointerEvent, selectedIds, activeEdge, camera, shapes, initialSelectionBounds]) => {
    const currentSelectionBounds = computeSelectionBoundsRect({
      selectedIds,
      shapes,
    })

    if (isLeft(currentSelectionBounds) || isNull(activeEdge)) return left(null)

    const cursorInCanvas = screenToCanvas({
      point: getPointFromEvent(pointerEvent),
      camera
    })

    const params: RecalculateFromEdgeParams = {
      current: currentSelectionBounds.value,
      first: initialSelectionBounds.value,
      cursor: cursorInCanvas
    }

    console.log("ASD") // Выводиться

    return match(activeEdge, {
      bottom: () => right(recalculateSelectionBoundsFromEdge.bottom(params)),
      right: () => right(recalculateSelectionBoundsFromEdge.right(params)),
      left: () => right(recalculateSelectionBoundsFromEdge.left(params)),
      top: () => right(recalculateSelectionBoundsFromEdge.top(params)),
    }, "id")
  }),
  rx.takeUntil(pointerUp$),
)

export const autoSelectionBounds$ = rx.combineLatest([shapes$, viewModelState$]).pipe(
  rx.map(([shapes, { selectedIds }]) => computeSelectionBoundsRect({ selectedIds, shapes })),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

const manualSelectionBounds$ = pointerDown$.pipe(
  rx.withLatestFrom(viewModelState$),
  rx.filter(([, state]) => {
    return state.type === "idle" && state.selectedIds.size >= 2
  }),

  rx.switchMap(([, state]) => {
    return pointerMove$.pipe(
      rx.filter(event => event.ctrlKey),

      rx.withLatestFrom(
        selectedShapesIds$,
        camera$,
        shapes$,
        autoSelectionBounds$.pipe(rx.first())
      ),

      rx.map(([moveEvent, selectedIds, camera, shapes, initialBounds]) => {
        const cursorInCanvas = screenToCanvas({
          point: getPointFromEvent(moveEvent),
          camera,
        })

        const currentBounds = computeSelectionBoundsRect({
          shapes,
          selectedIds,
        })

        if (isLeft(initialBounds) || isLeft(currentBounds)) return left(null)

        return right(recalculateSelectionBoundsFromEdge.right({
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

manualSelectionBounds$.subscribe(console.log)

export const selectionBounds$ = rx.merge(autoSelectionBounds$, manualSelectionBounds$)

// selectionBounds$.subscribe(console.log)

export const shapesToRecord$ = shapes$.pipe(
  rx.distinctUntilChanged((prev, current) => current.length === prev.length),
  rx.map((nodes) => Object.fromEntries(nodes.map(node => ([node.id, node])))),
)
