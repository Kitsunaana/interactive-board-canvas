import { matchEither } from "@/shared/lib/either.ts";
import { match } from "@/shared/lib/match.ts";
import { getPointFromEvent, screenToCanvas, subtractPoint } from "@/shared/lib/point.ts";
import { isRectIntersectionV2 } from "@/shared/lib/rect.ts";
import type { Point } from "@/shared/type/shared.ts";
import * as rx from "rxjs";
import { endMoveShape, movingShape, startMoveShape } from "../../domain/_moving.ts";
import type { Bound } from "../../domain/_selection/_selection.type.ts";
import { shapeSelect } from "../../domain/_selection/index.ts";
import { getShapesResizeStrategy, isBound, isCanvas, isShape } from "../../domain/index.ts";
import { shapes$ } from "../../model/index.ts";
import { camera$ } from "../../modules/_camera/_stream.ts";
import { mouseDown$, mouseUp$, pointerLeave$, pointerMove$, pointerUp$, wheel$ } from "../../modules/_pick-node/_events.ts";
import { selectionBounds$, viewModelState$ } from "./_view-model.ts";
import { goToIdle, goToNodesDragging, goToShapesResize, type IdleViewState, } from "./_view-model.type.ts";

const shapesResizeFlow$ = mouseDown$.pipe(
  rx.filter((params) => isBound(params.node)),
  rx.withLatestFrom(viewModelState$, shapes$, camera$),
  rx.filter(([_, viewModelState]) => viewModelState.type === "idle"),
  rx.map(([bound, viewState, shapes, camera]) => ({
    node: bound.node as Bound, idleState: viewState as IdleViewState, downEvent: bound.event, shapes, camera
  })),
  rx.switchMap(({ node, idleState, shapes, camera }) => {
    const resizeShapesStrategy = getShapesResizeStrategy({
      idleState,
      shapes,
      node,
    })

    const sharedMove$ = pointerMove$.pipe(rx.share())

    return rx.merge(
      sharedMove$.pipe(
        rx.take(1),
        rx.tap(() => {
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
        rx.takeUntil(rx.merge(pointerUp$, pointerLeave$, wheel$)),
        rx.ignoreElements(),
      ),

      sharedMove$.pipe(
        rx.map((pointerEvent) => {
          const pointerPosition = getPointFromEvent(pointerEvent)
          const canvasPoint = screenToCanvas({ camera, point: pointerPosition })

          const res = resizeShapesStrategy({
            proportional: pointerEvent.shiftKey,
            canvasPoint,
          })

          return res
        }),
        rx.takeUntil(
          rx.merge(pointerUp$, pointerLeave$, wheel$).pipe(rx.tap(() => {
            viewModelState$.next(goToIdle({ selectedIds: idleState.selectedIds }))

            document.documentElement.style.cursor = "default"
          }))
        )
      )
    )
  })
)

shapesResizeFlow$.subscribe(shapes$)

const shapeSelectFlow$ = mouseUp$.pipe(
  rx.filter(({ event }) => !event.shiftKey && event.button === 0),
  rx.filter(({ node }) => isShape(node) || isCanvas(node)),
  rx.withLatestFrom(viewModelState$),
  rx.map(([upEvent, state]) => ({ ...upEvent, state })),
  rx.switchMap(({ node, event, state }) => match(state, {
    shapesResize: (state) => rx.of(state),

    nodesDragging: (state) => rx.of(state.needToDeselect ? goToIdle() : state),

    idle: (idleState) => match(node, {
      bound: () => rx.of(null).pipe(rx.map(() => idleState)),

      grid: () => rx.of(null).pipe(rx.map(() => goToIdle())),

      arrow: () => rx.of(null).pipe(rx.map(() => idleState)),

      square: () => rx.of(null).pipe(rx.map(() => idleState)),

      circle: ({ id: shapeId }) => rx.of(null).pipe(rx.map(() => shapeSelect({ idleState, shapeId, event }))),

      rectangle: ({ id: shapeId }) => rx.of(null).pipe(rx.map(() => shapeSelect({ idleState, shapeId, event }))),
    }),
  })),
)

const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y)

const shapesDraggingFlow$ = mouseDown$.pipe(
  rx.filter(({ event }) => event.button === 0),

  rx.switchMap((params) => {
    return rx.of(params).pipe(
      rx.withLatestFrom(selectionBounds$),
      rx.filter(([{ node, point }, selectionBounds]) => {
        return matchEither(selectionBounds, {
          right: ({ area: rect }) => isShape(node) || isRectIntersectionV2({ point, rect }),
          left: () => isShape(node),
        })
      }),
      rx.map(([downEvent]) => downEvent)
    )
  }),

  rx.withLatestFrom(shapes$, camera$, viewModelState$),
  rx.filter(([_downEvent, _shapes, _camera, viewModelState]) => viewModelState.type === "idle"),

  rx.map(([{ point, node, event }, shapes, camera, viewModelState]) => ({
    idleState: viewModelState as IdleViewState,
    startPoint: point,
    downEvent: event,
    shape: node,
    camera,
    shapes,
  })),
  rx.switchMap(({ camera, downEvent, shape, shapes, startPoint, idleState }) => {
    const startPointInScreen = getPointFromEvent(downEvent)

    const sharedMove$ = pointerMove$.pipe(rx.takeWhile((event) => !event.shiftKey), rx.share())

    const waitForThreshold$ = sharedMove$.pipe(
      rx.filter((event) => distance(startPointInScreen, getPointFromEvent(event)) >= 8),
      rx.take(1),
      rx.tap(() => {
        viewModelState$.next(goToNodesDragging({
          needToDeselect: idleState.selectedIds.size === 0,
          selectedIds: idleState.selectedIds,
        }))

        match((shape), {
          circle: (shape) => viewModelState$.next(startMoveShape({ event: downEvent, point: startPoint, shape })),
          rectangle: (shape) => viewModelState$.next(startMoveShape({ event: downEvent, point: startPoint, shape })),
        })
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$, wheel$))
    )

    const drag$ = waitForThreshold$.pipe(rx.switchMap(() => sharedMove$.pipe(
      rx.skip(1),
      rx.map((event) => {
        const delta = subtractPoint(startPoint, screenToCanvas({
          point: getPointFromEvent(event),
          camera,
        }))

        return movingShape({
          selectedIds: viewModelState$.getValue().selectedIds,
          distance: delta,
          shapes,
        })
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$, wheel$)),
    )))

    const finish$ = rx.merge(pointerUp$, pointerLeave$, wheel$).pipe(
      rx.take(1),
      rx.tap(() => viewModelState$.next(endMoveShape())),
      rx.ignoreElements()
    )

    return rx.merge(drag$, finish$)
  })
)

shapeSelectFlow$.subscribe(viewModelState$)
shapesDraggingFlow$.subscribe(shapes$)