import type { Rect } from "@/shared/type/shared.ts";
import * as rx from "rxjs";
import { shapes$ } from "../../model/shapes.ts";
import type { ViewModelState } from "./_view-model.type.ts";
import { goToIdle, isSelectionWindow } from "./_view-model.type.ts";

export const viewState$ = new rx.BehaviorSubject<ViewModelState>(goToIdle())

export const selectedShapesIds$ = viewState$.pipe(
  rx.filter(state => "selectedIds" in state),
  rx.map(state => state.selectedIds),
  rx.startWith(new Set<string>()),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

export const shapesToRecord$ = shapes$.pipe(
  rx.map((nodes) => Object.fromEntries(nodes.map((node) => ([node.id, node])))),
  rx.shareReplay({ refCount: true, bufferSize: 1 })
)

export const shapesToView$ = rx.combineLatest({ state: viewState$, shapes: shapes$ }).pipe(rx.map(({ state, shapes }) => {
  switch (state.type) {
    case "idle":
    case "shapesResize":
    case "shapesDragging": {
      return shapes.map((shape) => {
        return {
          ...shape,
          client: {
            ...shape.client,
            isSelected: state.selectedIds.has(shape.id),
          }
        }
      })
    }


    case "selectionWindow":
    case "startPenDraw":
    case "penDrawing":
      return shapes
  }
}))


export const selectionWindow$ = viewState$.pipe(
  rx.map((state) => {
    if (isSelectionWindow(state)) {
      return {
        x: state.startPoint.x,
        y: state.startPoint.y,
        width: state.endPoint.x - state.startPoint.x,
        height: state.endPoint.y - state.startPoint.y
      } satisfies Rect
    }

    return undefined
  }),
)

