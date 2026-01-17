import { matchEither, type Right } from "@/shared/lib/either.ts";
import { match } from "@/shared/lib/match.ts";
import { getPointFromEvent, screenToCanvas, subtractPoint } from "@/shared/lib/point.ts";
import { isRectIntersectionV2 } from "@/shared/lib/rect.ts";
import type { Point } from "@/shared/type/shared.ts";
import * as rx from "rxjs";
import { endMoveShape, moveShape, startMoveShape } from "../../domain/_moving.ts";
import type { Bound } from "../../domain/_selection/_selection.type.ts";
import { shapeSelect } from "../../domain/_selection/index.ts";
import { getShapesResizeStrategy, isBound, isCanvas, isShape } from "../../domain/index.ts";
import { shapes$ } from "../../model/index.ts";
import { camera$ } from "../../modules/_camera/_stream.ts";
import type { SelectionBounds } from "../../modules/_pick-node/_core.ts";
import { mouseDown$, mouseUp$, pointerLeave$, pointerMove$, pointerUp$, wheel$ } from "../../modules/_pick-node/_events.ts";
import { autoSelectionBounds$, pressedEdgeSubject$, selectionBounds$, viewModel$, viewModelState$ } from "./_view-model.ts";
import { goToIdle, goToNodesDragging, goToShapesResize, type IdleViewState, } from "./_view-model.type.ts";

const applyResizeCursor = (node: Bound) => {
  document.documentElement.style.cursor = match(node, {
    bottom: () => "ns-resize",
    right: () => "ew-resize",
    left: () => "ew-resize",
    top: () => "ns-resize",
  }, "id")
}

const shapesResizeFlow$ = mouseDown$.pipe(
  rx.filter((params) => isBound(params.node)),
  rx.withLatestFrom(viewModelState$, viewModel$, camera$, autoSelectionBounds$),
  rx.filter(([_, viewModelState, , , selectionBounds]) => (
    viewModelState.type === "idle" && selectionBounds.type === "right"
  )),
  rx.map(([downEvent, viewState, viewModel, camera, selectionBounds]) => ({
    selectionBounds: (selectionBounds as Right<SelectionBounds>).value,
    selectedIds: (viewState as IdleViewState).selectedIds,
    node: downEvent.node as Bound,

    downEvent: downEvent.event,
    shapes: viewModel.nodes,

    camera,
  })),
  rx.switchMap(({ camera, node, shapes, selectedIds, selectionBounds }) => {
    const resizeShapesStrategy = getShapesResizeStrategy({
      selectionBounds,
      selectedIds,
      shapes,
      node,
    })

    const sharedMove$ = pointerMove$.pipe(rx.share())

    return rx.merge(
      sharedMove$.pipe(
        rx.take(1),
        rx.tap(() => {
          applyResizeCursor(node)

          pressedEdgeSubject$.next(node)
          viewModelState$.next(goToShapesResize({ selectedIds }))
        }),
        rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
        rx.ignoreElements(),
      ),

      sharedMove$.pipe(
        rx.map((moveEvent) => {
          const cursorPosition = getPointFromEvent(moveEvent)
          const canvasPoint = screenToCanvas({ camera, point: cursorPosition })

          return resizeShapesStrategy({
            proportional: moveEvent.shiftKey,
            reflow: moveEvent.ctrlKey,
            canvasPoint,
          })
        }),
        rx.takeUntil(
          rx.merge(pointerUp$, pointerLeave$).pipe(rx.tap(() => {
            viewModelState$.next(goToIdle({ selectedIds }))

            document.documentElement.style.cursor = "default"
          }))
        ),
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
      grid: () => rx.of(goToIdle()),

      bound: () => rx.of(idleState),
      arrow: () => rx.of(idleState),
      square: () => rx.of(idleState),

      circle: ({ id: shapeId }) => rx.of(shapeSelect({ idleState, shapeId, event })),

      rectangle: ({ id: shapeId }) => rx.of(shapeSelect({ idleState, shapeId, event })),
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

        return moveShape({
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