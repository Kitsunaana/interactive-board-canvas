import { match } from "@/shared/lib/match.ts";
import * as rx from "rxjs"
import { computeSelectionBoundsRect } from "../../domain/_selection/index.ts";
import type { ShapeToView } from "../../domain/_shape.ts";
import { shapes$, shapesToView$ } from "../../model/index.ts";
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

export const selectionBounds$ = rx.combineLatest([shapes$, viewModelState$]).pipe(
  rx.map(([nodes, { selectedIds }]) => computeSelectionBoundsRect({ selectedIds, shapes: nodes })),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

export const shapesToRecord$ = shapes$.pipe(
  rx.distinctUntilChanged((prev, current) => current.length === prev.length),
  rx.map((nodes) => Object.fromEntries(nodes.map(node => ([node.id, node])))),
)
