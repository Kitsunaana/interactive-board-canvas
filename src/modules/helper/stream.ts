import { BehaviorSubject, combineLatest, EMPTY, filter, fromEvent, map, pipe, scan, switchMap, takeUntil, tap, withLatestFrom } from "rxjs";
import { nodes$, nodesToView$, toRRB, type Node } from "../../nodes";
import { getPointFromEvent, screenToCanvas, subtractPoint } from "../../point";
import { canvas, initialCanvas } from "../../setup";
import { cameraSubject$, type Camera } from "../camera";
import { selectItems, viewModelState$, type SelectionModifier } from "../view-model";

const replaceNodeById = <T>(list: T[], index: number, node: T | undefined): T[] => {
  if (index === -1) return list

  const prev = list.slice(0, index)
  const next = list.slice(index + 1, list.length)

  if (node === undefined) return prev.concat(next)
  return prev.concat(node, next)
}

const [helperContext] = initialCanvas({
  height: window.innerHeight,
  width: window.innerWidth,
  canvasId: "helper",
})

const pointerDown$ = fromEvent<PointerEvent>(canvas, "pointerdown")
const pointerMove$ = fromEvent<PointerEvent>(canvas, "pointermove")
const pointerUp$ = fromEvent<PointerEvent>(canvas, "pointerup")

combineLatest([pointerDown$, cameraSubject$])
  .pipe(
    filter(([downEvent]) => downEvent.button === 0),
    withLatestFrom(nodesToView$, viewModelState$),
    switchMap(([[downEvent, { camera }], nodes, viewModelState]) => {
      renderHelperNodes(helperContext, camera, nodes)

      const pointerDownScreenPoint = getPointFromEvent(downEvent)
      const pointerDownWorldPoint = screenToCanvas({
        point: pointerDownScreenPoint,
        camera
      })

      const pixelData = helperContext.getImageData(pointerDownScreenPoint.x, pointerDownScreenPoint.y, 1, 1)
      const [red, green, blue] = pixelData.data
      const pickedColorId = toRRB(red, green, blue)

      const pickedNode = nodes.find((node) => node.colorId === pickedColorId)
      if (pickedNode === undefined) return EMPTY

      const modif: SelectionModifier = downEvent.ctrlKey || downEvent.shiftKey
        ? "toggle"
        : "replace"

      viewModelState$.next({
        ...viewModelState,
        selectedIds: selectItems({
          initialSelected: viewModelState.selectedIds,
          ids: [pickedNode.id],
          modif,
        })
      })

      return pointerMove$.pipe(
        map((moveEvent) => {
          return nodes.map((node) => {
            if (node.id === pickedNode.id) {
              const pointerMoveWorldPoint = screenToCanvas({
                point: getPointFromEvent(moveEvent),
                camera,
              })

              const delta = subtractPoint(pointerDownWorldPoint, pointerMoveWorldPoint)

              return {
                ...node,
                x: node.x + delta.x,
                y: node.y + delta.y,
              }
            }

            return node
          })
        }),
        takeUntil(pointerUp$),
        tap(value => nodes$.next(value)),
      )
    }),
  ).subscribe()

export function renderHelperNodes(
  context: CanvasRenderingContext2D,
  camera: Camera,
  nodes: Node[],
) {
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
