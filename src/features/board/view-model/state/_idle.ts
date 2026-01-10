import { match } from "@/shared/lib/match.ts";
import { getPointFromEvent, screenToCanvas, subtractPoint } from "@/shared/lib/point.ts";
import {
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
import { endMoveShape, movingShape, startMoveShape } from "../../domain/_moving.ts";
import type { Bound } from "../../domain/_selection/_selection.type.ts";
import { shapeSelect } from "../../domain/_selection/index.ts";
import { getShapesResizeStrategy, isBound, isCanvas, isShape } from "../../domain/index.ts";
import { shapes$ } from "../../model/index.ts";
import { camera$ } from "../../modules/_camera/_stream.ts";
import { mouseDown$, mouseUp$, pointerLeave$, pointerMove$, pointerUp$, wheel$ } from "../../modules/_pick-node/_events.ts";
import { viewModelState$ } from "./_view-model.ts";
import { goToIdle, goToNodesDragging, goToShapesResize, type IdleViewState, } from "./_view-model.type.ts";

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
  switchMap((params) => of(params).pipe(filter(({ node }) => isShape(node)))),
  withLatestFrom(shapes$, camera$, viewModelState$),
  filter(([_downEvent, _shapes, _camera, viewModelState]) => viewModelState.type === "idle"),
  map(([{ point, node, event }, shapes, camera, viewModelState]) => ({
    idleState: viewModelState as IdleViewState,
    startPoint: point,
    downEvent: event,
    shape: node,
    camera,
    shapes,
  })),
  switchMap(({ camera, downEvent, shape, shapes, startPoint, idleState }) => {
    const sharedMove$ = pointerMove$.pipe(share(), takeWhile((event) => !event.shiftKey))

    const goToNodesDragging$ = sharedMove$.pipe(
      take(1),
      tap(() => {
        viewModelState$.next(goToNodesDragging({
          needToDeselect: idleState.selectedIds.size === 0,
          selectedIds: idleState.selectedIds,
        }))

        match((shape), {
          circle: (shape) => {
            viewModelState$.next(startMoveShape({ event: downEvent, point: startPoint, shape }))
          },

          rectangle: (shape) => {
            viewModelState$.next(startMoveShape({ event: downEvent, point: startPoint, shape }))
          },
        })
      }),
      ignoreElements(),
      takeUntil(merge(pointerUp$, pointerLeave$, wheel$))
    )

    const shapesDragging$ = sharedMove$.pipe(
      skip(1),
      map((event) => {
        const distance = subtractPoint(startPoint, screenToCanvas({
          point: getPointFromEvent(event),
          camera,
        }))

        return movingShape({
          selectedIds: viewModelState$.getValue().selectedIds,
          distance,
          shapes,
        })
      }),
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
  })
)

shapeSelectFlow$.subscribe(viewModelState$)
shapesResizeFlow$.subscribe(shapes$)
shapesDraggingFlow$.subscribe(shapes$)