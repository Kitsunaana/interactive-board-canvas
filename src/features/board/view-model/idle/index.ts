import { match } from "@/shared/lib/match"
import { distance, getPointFromEvent, screenToCanvas, subtractPoint } from "@/shared/lib/point"
import { isRectIntersectionV2 } from "@/shared/lib/rect"
import { isNotNull } from "@/shared/lib/utils"
import * as rx from "rxjs"
import { isBound, isCanvas, isResizeHandler, isShape } from "../../domain/is"
import { getShapesResizeStrategy } from "../../domain/resize"
import { getShapesResizeStrategyViaResizeHandler } from "../../domain/resize/_handler-single"
import type { NodeBound } from "../../domain/selection-area"
import { shapes$ } from "../../model"
import { camera$ } from "../../modules/camera"
import { mouseDown$, mouseUp$, pointerLeave$, pointerMove$, pointerUp$, wheel$ } from "../../modules/pick-node"
import { autoSelectionBounds$, pressedEdgeSubject$ } from "../selection-bounds"
import { goToIdle, goToNodesDragging, goToShapesResize, isIdle, viewModel$, viewState$ } from "../state"
import { endMoveShapes, getMovedShapes, startMoveShape } from "./moving"
import { shapeSelect } from "./selection"

const applyResizeCursor = (node: NodeBound) => {
  document.documentElement.style.cursor = match(node, {
    bottom: () => "ns-resize",
    right: () => "ew-resize",
    left: () => "ew-resize",
    top: () => "ns-resize",
  }, "id")
}

const resetResizeCursor = () => {
  document.documentElement.style.cursor = "default"
}

const shapesResizeViaResizeHanlderFlow$ = mouseDown$.pipe(
  rx.map((downEvent) => downEvent.node),
  rx.filter(isResizeHandler),
  rx.withLatestFrom(
    viewState$.pipe(rx.filter(isIdle), rx.map((state) => state.selectedIds)),
    autoSelectionBounds$.pipe(rx.filter(isNotNull), rx.map((selection) => selection.area)),
    viewModel$.pipe(rx.map((model) => model.nodes)),
    camera$
  ),
  rx.map(([corner, selectedIds, selectionArea, shapes, camera]) => ({ selectionArea, selectedIds, camera, shapes, corner })),
  rx.switchMap(({ camera, corner, shapes, selectedIds, selectionArea }) => {
    const sharedMove$ = pointerMove$.pipe(rx.share())

    const resizeShapesStrategy = getShapesResizeStrategyViaResizeHandler({
      selectionArea,
      selectedIds,
      corner,
      shapes,
    })

    return rx.merge(
      sharedMove$.pipe(
        rx.take(1),
        rx.tap(() => {
          viewState$.next(goToShapesResize({ selectedIds }))
        }),
        rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
        rx.ignoreElements(),
      ),

      sharedMove$.pipe(
        rx.map((moveEvent) => {
          const cursorPosition = getPointFromEvent(moveEvent)
          const cursor = screenToCanvas({ camera, point: cursorPosition })

          return resizeShapesStrategy({
            proportional: moveEvent.shiftKey,
            reflow: moveEvent.ctrlKey,
            cursor,
          })
        }),
        rx.takeUntil(
          rx.merge(pointerUp$, pointerLeave$).pipe(rx.tap(() => {
            viewState$.next(goToIdle({ selectedIds }))
            resetResizeCursor()
          }))
        ),
      )
    )
  })
)

shapesResizeViaResizeHanlderFlow$.subscribe(shapes$)

const shapesResizeFlow$ = mouseDown$.pipe(
  rx.map((downEvent) => downEvent.node),
  rx.filter(isBound),
  rx.withLatestFrom(
    viewState$.pipe(rx.filter(isIdle), rx.map((state) => state.selectedIds)),
    autoSelectionBounds$.pipe(rx.filter(isNotNull), rx.map((selection) => selection.area)),
    viewModel$.pipe(rx.map((model) => model.nodes)),
    camera$
  ),
  rx.map(([edge, selectedIds, selectionArea, shapes, camera]) => ({ selectionArea, selectedIds, camera, shapes, edge })),
  rx.switchMap(({ camera, edge, shapes, selectedIds, selectionArea }) => {
    const resizeShapesStrategy = getShapesResizeStrategy({ selectionArea, selectedIds, shapes, edge })

    const sharedMove$ = pointerMove$.pipe(rx.share())

    return rx.merge(
      sharedMove$.pipe(
        rx.take(1),
        rx.tap(() => {
          applyResizeCursor(edge)

          pressedEdgeSubject$.next(edge)
          viewState$.next(goToShapesResize({ selectedIds }))
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
            cursor: canvasPoint,
          })
        }),
        rx.takeUntil(
          rx.merge(pointerUp$, pointerLeave$).pipe(rx.tap(() => {
            viewState$.next(goToIdle({ selectedIds }))
            resetResizeCursor()
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
  rx.withLatestFrom(viewState$),
  rx.map(([upEvent, state]) => ({ ...upEvent, state })),
  rx.switchMap(({ node, event, state }) => match(state, {
    shapesResize: (state) => rx.of(state),

    shapesDragging: (state) => rx.of(state.needToDeselect ? goToIdle() : state),

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

shapeSelectFlow$.subscribe(viewState$)

const shapesDraggingFlow$ = mouseDown$.pipe(
  rx.filter(({ event }) => event.button === 0),

  rx.switchMap((params) => rx.of(params).pipe(
    rx.withLatestFrom(autoSelectionBounds$),
    rx.filter(([{ node, point }, selectionBounds]) => {
      if (isNotNull(selectionBounds)) return isShape(node) || isRectIntersectionV2({
        rect: selectionBounds.area,
        point,
      })

      return isShape(node)
    }),
    rx.map(([downEvent]) => downEvent)
  )),

  rx.map(({ event, point, node }) => ({ downEvent: event, startPoint: point, shape: node })),
  rx.withLatestFrom(shapes$, camera$, viewState$.pipe(rx.filter(isIdle))),
  rx.map(([{ downEvent, shape, startPoint }, shapes, camera, idleState]) => ({
    startPoint, idleState, downEvent, camera, shapes, shape,
  })),
  rx.switchMap(({ camera, downEvent, shape, shapes, startPoint, idleState }) => {
    const startPointInScreen = getPointFromEvent(downEvent)

    const sharedMove$ = pointerMove$.pipe(rx.takeWhile((event) => !event.shiftKey), rx.share())

    const waitForThreshold$ = sharedMove$.pipe(
      rx.filter((event) => distance(startPointInScreen, getPointFromEvent(event)) >= 8),
      rx.take(1),
      rx.tap(() => {
        viewState$.next(goToNodesDragging({
          needToDeselect: idleState.selectedIds.size === 0,
          selectedIds: idleState.selectedIds,
        }))

        match((shape), {
          circle: (shape) => viewState$.next(startMoveShape({ downEvent, startPoint, shape })),
          rectangle: (shape) => viewState$.next(startMoveShape({ downEvent, startPoint, shape })),
        })
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$, wheel$))
    )

    const drag$ = waitForThreshold$.pipe(rx.switchMap(() => sharedMove$.pipe(
      rx.skip(1),
      rx.map((event) => {
        const distance = subtractPoint(startPoint, screenToCanvas({
          point: getPointFromEvent(event),
          camera,
        }))

        return getMovedShapes({
          selectedIds: viewState$.getValue().selectedIds,
          distance,
          shapes,
        })
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$, wheel$)),
    )))

    const finish$ = rx.merge(pointerUp$, pointerLeave$, wheel$).pipe(
      rx.take(1),
      rx.tap(() => viewState$.next(endMoveShapes())),
      rx.ignoreElements()
    )

    return rx.merge(drag$, finish$)
  })
)

shapesDraggingFlow$.subscribe(shapes$)