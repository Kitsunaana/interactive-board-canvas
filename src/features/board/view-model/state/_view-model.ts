import { match } from "@/shared/lib/match.ts";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  map,
  shareReplay
} from "rxjs";
import { computeSelectionBoundsRect } from "../../domain/_selection/index.ts";
import type { ShapeToView } from "../../domain/_shape.ts";
import { shapes$, shapesToView$ } from "../../model/index.ts";
import type { ViewModel, ViewModelState } from "./_view-model.type.ts";
import { goToIdle } from "./_view-model.type.ts";

export const viewModelState$ = new BehaviorSubject<ViewModelState>(goToIdle())

export const viewModel$ = combineLatest([viewModelState$, shapesToView$]).pipe(
  map(([state, nodes]) => match(state, {
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
  shareReplay({ bufferSize: 1, refCount: true })
)

export const selectionBounds$ = combineLatest([shapes$, viewModelState$]).pipe(
  map(([nodes, { selectedIds }]) => computeSelectionBoundsRect({ selectedIds, shapes: nodes })),
  shareReplay({ bufferSize: 1, refCount: true })
)

export const shapesToRecord$ = shapes$.pipe(
  distinctUntilChanged((prev, current) => current.length === prev.length),
  map((nodes) => Object.fromEntries(nodes.map(node => ([node.id, node])))),
)
