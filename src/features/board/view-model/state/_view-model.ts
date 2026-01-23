import { match } from "@/shared/lib/match.ts";
import { isNotUndefined } from "@/shared/lib/utils.ts";
import * as rx from "rxjs";
import { shapes$ } from "../../model/shapes.ts";
import { getCachedShapeToView } from "./_get-cached-shape.ts";
import type { ViewModel, ViewModelState } from "./_view-model.type.ts";
import { goToIdle } from "./_view-model.type.ts";

export const viewState$ = new rx.BehaviorSubject<ViewModelState>(goToIdle())

export const selectedShapesIds$ = viewState$.pipe(
  rx.filter(state => isNotUndefined(state.selectedIds)),
  rx.map(state => state.selectedIds),
  rx.startWith(new Set<string>()),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

export const shapesToRecord$ = shapes$.pipe(
  rx.map((nodes) => Object.fromEntries(nodes.map((node) => ([node.id, node])))),
  rx.shareReplay({ refCount: true, bufferSize: 1 })
)

export const viewModel$ = rx.combineLatest([
  viewState$, 
  shapes$.pipe(rx.map((shapes) => shapes.map(getCachedShapeToView)))
]).pipe(
  rx.map(([state, nodes]) => match(state, {
    shapesDragging: (state): ViewModel => ({
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

export const shapesToRender$ = viewModel$.pipe(rx.map(model => model.nodes))
