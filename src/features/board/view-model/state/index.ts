import { left, matchEither, right } from "@/shared/lib/either.ts";
import { match } from "@/shared/lib/match.ts";
import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point.ts";
import type { Point } from "@/shared/type/shared.ts";
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
import type { Shape } from "../../domain/dto.ts";
import { shapes$ } from "../../domain/node.ts";
import { camera$ } from "../../modules/_camera/_stream.ts";
import { mouseDown$, mouseUp$, pointerLeave$, pointerMove$, pointerUp$, wheel$ } from "../../modules/_pick-node/_events.ts";
import { endMoveShape, movingShape, startMoveShape } from "./idle/moving.ts";
import { independentResizeHandlers, proportionalResizeHandlers } from "./idle/resize";
import { shapeSelect } from "./idle/selection.ts";
import { selectionBounds$, viewModelState$ } from "./index-v2.ts";
import { goToIdle, goToNodesDragging, goToShapesResize, type IdleViewState, } from "./type.ts";

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

const computeProportionalAppliedEdgeResize = ({ canvasPoint, shape, node }: {
  canvasPoint: Point
  shape: Shape
  node: Bound
}) => {
  return match(node, {
    bottom: () => proportionalResizeHandlers.applyBottomEdgeResize({ canvasPoint, shape }),
    right: () => proportionalResizeHandlers.applyRightEdgeResize({ canvasPoint, shape }),
    left: () => proportionalResizeHandlers.applyLeftEdgeResize({ canvasPoint, shape }),
    top: () => proportionalResizeHandlers.applyTopEdgeResize({ canvasPoint, shape }),
  }, "id")
}

const computeIndependentAppliedEdgeResize = ({ canvasPoint, shape, node }: {
  canvasPoint: Point
  shape: Shape
  node: Bound
}) => {
  return match(node, {
    bottom: () => independentResizeHandlers.applyBottomEdgeResize({ canvasPoint, shape }),
    right: () => independentResizeHandlers.applyRightEdgeResize({ canvasPoint, shape }),
    left: () => independentResizeHandlers.applyLeftEdgeResize({ canvasPoint, shape }),
    top: () => independentResizeHandlers.applyTopEdgeResize({ canvasPoint, shape })
  }, "id")
}

const getShapesResizeStrategy = ({ idleState, shapes, node }: {
  idleState: IdleViewState
  shapes: Shape[]
  node: Bound
}) => {
  return matchEither(idleState.selectedIds.size > 1 ? right(null) : left(null), {
    right: () => {
      return ({ canvasPoint: _ }: { canvasPoint: Point }) => shapes
    },

    left: () => ({ canvasPoint }: { canvasPoint: Point }) => shapes.map((shape) => {
      if (idleState.selectedIds.has(shape.id)) {
        return match(shape, {
          rectangle: () => computeIndependentAppliedEdgeResize({ canvasPoint, shape, node }),
          circle: () => computeProportionalAppliedEdgeResize({ canvasPoint, shape, node }),
          square: () => computeIndependentAppliedEdgeResize({ canvasPoint, shape, node }),
          arrow: () => shape,
        })
      }

      return shape
    })
  })
}

const shapesResizeFlow$ = mouseDown$.pipe(
  filter((params) => isBound(params.node)),
  withLatestFrom(viewModelState$, shapes$, camera$),
  filter(([_, viewModelState]) => viewModelState.type === "idle"),
  map(([bound, viewState, shapes, camera]) => ({ node: bound.node as Bound, idleState: viewState as IdleViewState, shapes, camera })),
  switchMap(({ node, idleState, shapes, camera }) => {
    const resizeShapesStrategy = getShapesResizeStrategy({ idleState, shapes, node })

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

          viewModelState$.next(goToShapesResize({
            selectedIds: idleState.selectedIds
          }))
        }),
        ignoreElements(),
        takeUntil(merge(pointerUp$, pointerLeave$, wheel$))
      ),

      sharedMove$.pipe(
        map((pointerEvent) => {
          const pointerPosition = getPointFromEvent(pointerEvent)
          const canvasPoint = screenToCanvas({ camera, point: pointerPosition })

          return resizeShapesStrategy({ canvasPoint })
        }),
        takeUntil(
          merge(pointerUp$, pointerLeave$, wheel$).pipe(tap(() => {
            viewModelState$.next(goToIdle({ selectedIds: idleState.selectedIds }))

            document.documentElement.style.cursor = "default"
          }))
        )
      )
    )
  })
)

const shapeSelectFlow$ = mouseUp$.pipe(
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
)

const shapesDraggingFlow$ = mouseDown$.pipe(
  filter(({ event }) => event.button === 0),
  switchMap((params) => {
    return of(params).pipe(filter(({ node }) => isShape(node)))
  }),
  withLatestFrom(shapes$, camera$, viewModelState$, selectionBounds$),
  map(([downEvent, shapes, camera, state, selectedRect]) => ({ ...downEvent, selectedRect, shapes, camera, state })),
  switchMap(({ camera, event, node, shapes, point, state }) => match(state, {
    nodesDragging: () => EMPTY,

    shapesResize: () => EMPTY,

    idle: (idleState) => {
      const sharedMove$ = pointerMove$.pipe(share(), takeWhile((event) => !event.shiftKey))

      const goToNodesDragging$ = sharedMove$.pipe(
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
      )

      const shapesDragging$ = sharedMove$.pipe(
        skip(1),
        map((event) => movingShape({ event, point, shapes, camera })),
        takeUntil(merge(pointerUp$, pointerLeave$, wheel$))
      )

      const finishShapesDragging$ = sharedMove$.pipe(
        takeUntil(merge(pointerUp$, pointerLeave$, wheel$)),
        ignoreElements(),
        finalize(() => {
          viewModelState$.next(endMoveShape())
        })
      )

      return merge(goToNodesDragging$, shapesDragging$, finishShapesDragging$)
    }
  }))
)

shapeSelectFlow$.subscribe(viewModelState$)
shapesResizeFlow$.subscribe(shapes$)
shapesDraggingFlow$.subscribe(shapes$)