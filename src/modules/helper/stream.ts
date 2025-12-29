import {isNil} from "lodash";
import {
  filter,
  finalize,
  fromEvent,
  ignoreElements,
  map,
  merge,
  Observable,
  share,
  skip,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom
} from "rxjs";
import {type Node, nodes$, nodesToView$, type NodeToView} from "../../nodes";
import {canvas, initialCanvas} from "../../setup";
import {type Camera, cameraSubject$} from "../camera";
import {viewModelState$} from "../view-model";
import {findNodeByColorId, moveSelectedNodes, nodesSelection} from "./core";
import type {Point} from "../../type.ts";

const [context] = initialCanvas({
  height: window.innerHeight,
  width: window.innerWidth,
  canvasId: "helper",
})

const pointerMove$ = fromEvent<PointerEvent>(canvas, "pointermove")
const pointerDown$ = fromEvent<PointerEvent>(canvas, "pointerdown")
const pointerUp$ = fromEvent<PointerEvent>(canvas, "pointerup")
const wheel$ = fromEvent<WheelEvent>(canvas, "wheel")

const createPointerNodePick$ = (pointer$: Observable<PointerEvent>) =>
  pointer$.pipe(
    withLatestFrom(nodesToView$, cameraSubject$),
    map(([event, nodes, { camera }]) => ({ event, nodes, camera, context })),
    tap((params) => renderHelperNodes(params)),
    map(findNodeByColorId),
    filter(({ node }) => !isNil(node)),
  )

export const mouseDown$ = createPointerNodePick$(pointerDown$)
export const mouseMove$ = createPointerNodePick$(pointerMove$)
export const mouseUp$ = createPointerNodePick$(pointerUp$)

const selection$ = mouseUp$.pipe(
  filter(({ event }) => event.button === 0),
  withLatestFrom(viewModelState$),
  map(([{ event, node }, viewModelState]) => {
    if (isNil(node)) return viewModelState

    return ({
      sticker: () => nodesSelection({ viewModelState, event, node })
    })[node.type]()
  }),
)

merge(selection$).subscribe(viewModelState$)

const startMoveOneNode = ({ event, node, nodes, point }: {
  event: PointerEvent
  nodes: NodeToView[]
  node?: NodeToView
  point: Point
}) => {
  const currentState = viewModelState$.getValue()
  const hasPressedKeys = event.ctrlKey || event.shiftKey

  if (!currentState.selectedIds.has(node!.id) && !hasPressedKeys) {
    viewModelState$.next({
      ...currentState,
      mouseDown: point,
      selectedIds: new Set(node!.id),
    })
  }

  return nodes
}

const movingOneNode = ({ nodes, camera, point, event }: {
  event: PointerEvent
  nodes: NodeToView[]
  camera: Camera
  point: Point
}) => {
  const currentState = viewModelState$.getValue()
  const selectedIds = currentState.selectedIds

  return moveSelectedNodes({ selectedIds, camera, point, nodes, event })
}

const endMoveOneNode = ({ nodes }: { nodes: NodeToView[] }) => {
  const currentState = viewModelState$.getValue()

  if (!isNil(currentState.mouseDown)) {
    viewModelState$.next({
      ...currentState,
      mouseDown: undefined,
      selectedIds: new Set()
    })
  }

  return nodes
}

mouseDown$.pipe(
  filter(({ event }) => event.button === 0),
  withLatestFrom(nodesToView$, viewModelState$, cameraSubject$),
  switchMap(([{ point, node, event }, nodes, _, { camera }]) => {
    const sharedMove$ = pointerMove$.pipe(share())

    return merge(
      sharedMove$.pipe(take(1), map(() => startMoveOneNode({ event, node, point, nodes }))),

      sharedMove$.pipe(
        skip(1),
        map((event) => movingOneNode({ event, point, nodes, camera })),
        takeUntil(merge(pointerUp$, wheel$))
      ),

      sharedMove$.pipe(
        takeUntil(merge(pointerUp$, wheel$)),
        ignoreElements(),
        finalize(() => endMoveOneNode({ nodes }))
      ),
    )
  })
).subscribe(nodes$)

export function renderHelperNodes({ context, camera, nodes }: {
  context: CanvasRenderingContext2D
  camera: Camera
  nodes: Node[]
}) {
  context.save()

  context.clearRect(0, 0, window.innerWidth / 2, window.innerHeight)

  context.translate(camera.x, camera.y)
  context.scale(camera.scale, camera.scale)

  nodes.forEach((rect) => {
    if (rect.colorId === undefined) return

    const { x, y, width, height } = rect

    context.save()
    context.beginPath()
    context.fillStyle = rect.colorId
    context.rect(x, y, width, height)
    context.fill()
    context.restore()
  })

  context.restore()
}
