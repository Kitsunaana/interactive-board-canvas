import { match } from "@/shared/lib/match.ts";
import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point.ts";
import {
  EMPTY,
  filter,
  finalize,
  ignoreElements,
  map,
  merge,
  of,
  share,
  skip,
  switchMap,
  take,
  takeUntil,
  takeWhile,
  tap,
  withLatestFrom
} from "rxjs";
import { shapes$ } from "../../domain/node.ts";
import { camera$ } from "../../modules/_camera/_stream.ts";
import { mouseDown$, mouseUp$, pointerLeave$, pointerMove$, pointerUp$, wheel$ } from "../../modules/_pick-node/_events.ts";
import { endMoveShape, movingShape, startMoveShape } from "./idle/moving.ts";
import { applyBottomEdgeResize, applyLeftEdgeResize, applyRightEdgeResize, applyTopEdgeResize } from "./idle/resize.ts";
import { shapeSelect } from "./idle/selection.ts";
import { selectionBounds$, viewModelState$ } from "./index-v2.ts";
import { goToIdle, goToNodesDragging, } from "./type.ts";

const isBound = <T extends { id: string }>(candidate: T) => (
  candidate.id === "bottom" ||
  candidate.id === "right" ||
  candidate.id === "left" ||
  candidate.id === "top"
)

const isShape = <T extends { type: string }>(candidate: T) => {
  return (
    candidate.type === "rectangle" ||
    candidate.type === "circle" ||
    candidate.type === "square"
  )
}

const isCanvas = <T extends { type: string }>(candidate: T) => {
  return candidate.type === "grid"
}

type Bound = {
  id: "top" | "right" | "bottom" | "left"
  type: "bound"
}

mouseDown$.pipe(
  filter((params) => isBound(params.node)),
  withLatestFrom(viewModelState$, shapes$, camera$),
  map(([bound, viewState, shapes, camera]) => ({ node: bound.node as Bound, viewState, shapes, camera })),
  switchMap(({ node, viewState, shapes, camera }) => {
    return match(viewState, {
      nodesDragging: () => EMPTY,

      idle: (idleState) => {
        const sharedMove$ = pointerMove$.pipe(share(), takeWhile((event) => !event.shiftKey))

        return merge(
          sharedMove$.pipe(
            take(1),
            tap(() => {
              document.documentElement.style.cursor = match(node, {
                bottom: () => "ns-resize",
                right: () => "ew-resize",
                left: () => "ew-resize",
                top: () => "ns-resize",
              }, "id")
            }),
            ignoreElements(),
            takeUntil(merge(pointerUp$, pointerLeave$, wheel$))
          ),

          sharedMove$.pipe(
            map((pointerEvent) => {
              const pointerPosition = getPointFromEvent(pointerEvent)
              const canvasPoint = screenToCanvas({ camera, point: pointerPosition })

              return shapes.map((shape) => {
                if (idleState.selectedIds.has(shape.id)) {
                  return match(node, {
                    bottom: () => applyBottomEdgeResize({ canvasPoint, shape }),
                    right: () => applyRightEdgeResize({ canvasPoint, shape }),
                    left: () => applyLeftEdgeResize({ canvasPoint, shape }),
                    top: () => applyTopEdgeResize({ canvasPoint, shape })
                  }, "id")
                }

                return shape
              })
            }),
            takeUntil(
              merge(pointerUp$, pointerLeave$, wheel$).pipe(tap(() => document.documentElement.style.cursor = "default"))
            )
          )
        )
      }
    })
  })
).subscribe(shapes$)

mouseUp$.pipe(
  filter(({ event }) => !event.shiftKey && event.button === 0),
  filter(({ node }) => isShape(node) || isCanvas(node)),
  withLatestFrom(viewModelState$),
  map(([upEvent, state]) => ({ ...upEvent, state })),
  switchMap(({ node, event, state }) => match(state, {
    nodesDragging: (state) => of(state.needToDeselect ? goToIdle() : state),

    idle: (idleState) => match(node, {
      bound: () => of(null).pipe(map(() => idleState)),

      grid: () => of(null).pipe(map(() => goToIdle())),

      arrow: () => of(null).pipe(map(() => idleState)),

      square: () => of(null).pipe(map(() => idleState)),

      circle: ({ id: shapeId }) => of(null).pipe(map(() => shapeSelect({ idleState, shapeId, event }))),

      rectangle: ({ id: shapeId }) => of(null).pipe(map(() => shapeSelect({ idleState, shapeId, event }))),
    }),
  })),
).subscribe(viewModelState$)

mouseDown$.pipe(
  filter(({ event }) => event.button === 0),
  switchMap((params) => {
    return of(params).pipe(filter(({ node }) => isShape(node)))
  }),
  withLatestFrom(shapes$, camera$, viewModelState$, selectionBounds$),
  map(([downEvent, stickers, camera, state, selectedRect]) => ({ ...downEvent, selectedRect, stickers, camera, state })),
  switchMap(({ camera, event, node, stickers, point, state }) => match(state, {
    nodesDragging: () => EMPTY,

    idle: (idleState) => {
      const sharedMove$ = pointerMove$.pipe(share(), takeWhile((event) => !event.shiftKey))

      return merge(
        sharedMove$.pipe(
          take(1),
          tap(() => {
            viewModelState$.next(goToNodesDragging({
              needToDeselect: idleState.selectedIds.size === 0,
              selectedIds: idleState.selectedIds,
            }))

            match(node, {
              circle: (shape) => {
                viewModelState$.next(startMoveShape({ event, point, shape }))
              },

              rectangle: (shape) => {
                viewModelState$.next(startMoveShape({ event, point, shape }))
              },
            })
          }),
          ignoreElements(),
          takeUntil(merge(pointerUp$, pointerLeave$, wheel$))
        ),

        sharedMove$.pipe(
          skip(1),
          map((event) => movingShape({ event, point, shapes: stickers, camera })),
          takeUntil(merge(pointerUp$, pointerLeave$, wheel$))
        ),

        sharedMove$.pipe(
          takeUntil(merge(pointerUp$, pointerLeave$, wheel$)),
          ignoreElements(),
          finalize(() => {
            viewModelState$.next(endMoveShape())
          })
        ),
      )
    }
  }))
).subscribe(shapes$)