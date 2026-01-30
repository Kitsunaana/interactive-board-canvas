import { SELECTION_BOUNDS_PADDING } from "@/entities/shape"
import { getBoundingBox } from "@/entities/shape/model/get-bounding-box"
import { markDirtySelectedShapes } from "@/entities/shape/model/render-state"
import { getPointFromEvent, screenToCanvasV2 } from "@/shared/lib/point"
import { calculateLimitPointsFromRects, getAABBSize } from "@/shared/lib/rect"
import { isNotNull } from "@/shared/lib/utils"
import type { Point, Rect, RotatableRect } from "@/shared/type/shared"
import * as rx from "rxjs"
import type { Bound } from "../../domain/selection-area"
import { camera$ } from "../../modules/camera"
import { mouseDown$, pointerLeave$, pointerMove$, pointerUp$ } from "../../modules/pick-node"
import { autoSelectionBounds$, pressedResizeHandlerSubject$ } from "../../view-model/selection-bounds"
import { goToIdle, goToShapesResize, isIdle, isShapesResize, shapesToRender$, viewState$ } from "../../view-model/state"
import { shapes$ } from "../shapes"

const applyResizeViaBoundCursor = (node: Bound) => {
  document.documentElement.style.cursor = ({
    bottom: "ns-resize",
    right: "ew-resize",
    left: "ew-resize",
    top: "ns-resize",
  }[node])
}

const resetResizeCursor = () => {
  document.documentElement.style.cursor = "default"
}

type GroupResizeState = {
  pivotX: number
  pivotY: number
  initialWidth: number
  shapes: Array<{
    id: string
    centerX: number
    centerY: number
    offsetX: number
    width: number
    height: number
    rotate: number
  }>
}

export const createGroupRightResizeState = (shapes: RotatableRect<true>[], bounds: Rect): GroupResizeState => {
  const pivotX = bounds.x
  const pivotY = bounds.y

  return {
    pivotX,
    pivotY,
    initialWidth: bounds.width,
    shapes: shapes.map(shape => {
      const centerX = shape.x + shape.width / 2
      const centerY = shape.y + shape.height / 2

      return {
        id: shape.id,
        centerX,
        centerY,
        width: shape.width,
        height: shape.height,
        rotate: shape.rotate,
        offsetX: centerX - pivotX,
      }
    }),
  }
}

export const calcGroupRightBoundResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialWidth, pivotX, shapes } = state

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const nextWidth = correctedCursorX - pivotX

  if (nextWidth > 0) {
    const scaleX = nextWidth / initialWidth

    return shapes.map(shape => {
      const nextCenterX = pivotX + shape.offsetX * scaleX
      const nextWidthShape = shape.width * scaleX

      return {
        id: shape.id,
        x: nextCenterX - nextWidthShape / 2,
        y: shape.centerY - shape.height / 2,
        width: nextWidthShape,
        height: shape.height,
        rotate: shape.rotate,
      }
    })
  }

  if (-nextWidth <= SELECTION_BOUNDS_PADDING * 2) {
    return shapes.map(shape => ({
      id: shape.id,
      x: pivotX,
      y: shape.centerY - shape.height / 2,
      width: 0,
      height: shape.height,
      rotate: shape.rotate,
    }))
  }

  const flipWidth = -nextWidth - SELECTION_BOUNDS_PADDING * 2
  const scaleX = flipWidth / initialWidth

  return shapes.map(shape => {
    const nextCenterX = pivotX - shape.offsetX * scaleX
    const nextWidthShape = shape.width * scaleX

    return {
      id: shape.id,
      x: nextCenterX - nextWidthShape / 2,
      y: shape.centerY - shape.height / 2,
      width: nextWidthShape,
      height: shape.height,
      rotate: shape.rotate,
    }
  })
}

export const shapesResizeFlowViaBound$ = mouseDown$.pipe(
  rx.map(event => event.node),
  rx.filter((node) => node.type === "bound"),
  rx.withLatestFrom(
    viewState$.pipe(rx.filter(isIdle), rx.map((state) => state.selectedIds)),
    autoSelectionBounds$.pipe(rx.filter(isNotNull), rx.map((selection) => selection.bounds)),
    shapesToRender$,
    camera$
  ),
  rx.map(([{ bound }, selectedIds, selectionBounds, shapes, camera]) => ({ selectionBounds, selectedIds, camera, shapes, handler: bound })),
  rx.switchMap(({ camera, handler, shapes, selectedIds, selectionBounds }) => {
    shapes.map((shape) => {
      if (shape.client.isSelected) shape.client.renderMode.kind = "vector"
      return shape
    })

    const sharedMove$ = pointerMove$.pipe(rx.share())

    const nodes = shapes.filter(shape => shape.geometry.kind === "rectangle-geometry")
    const aabb = calculateLimitPointsFromRects({ rects: nodes.map((shape) => getBoundingBox(shape.geometry, shape.transform.rotate)) })
    const boundingBox = getAABBSize({ minX: aabb.min.x, minY: aabb.min.y, maxX: aabb.max.x, maxY: aabb.max.y })

    const resizeActivation$ = sharedMove$.pipe(
      rx.take(1),
      rx.tap(() => {
        applyResizeViaBoundCursor(handler)

        pressedResizeHandlerSubject$.next({ type: "bound", bound: handler })
        viewState$.next(goToShapesResize({ selectedIds, boundingBox, bounds: selectionBounds }))
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
      rx.ignoreElements(),
    )

    const resizeState = createGroupRightResizeState(nodes.map(shape => ({
      ...shape.geometry, rotate: shape.transform.rotate, id: shape.id,
    }) as unknown as RotatableRect<true>), boundingBox)

    const resizeProgress$ = sharedMove$.pipe(
      rx.withLatestFrom(
        viewState$.pipe(rx.filter(isShapesResize)), 
        autoSelectionBounds$.pipe(rx.filter(isNotNull), rx.map(value => value.bounds))
      ),
      rx.map(([moveEvent, state, bounds]) => {
        const point = getPointFromEvent(moveEvent)
        const cursor = screenToCanvasV2(point, camera)

        const areaRight = state.boundingBox.x + state.boundingBox.width
        const delta = cursor.x - SELECTION_BOUNDS_PADDING - areaRight

        viewState$.next(goToShapesResize({
          ...state,
          bounds,
          boundingBox: {
            ...state.boundingBox,
            width: state.boundingBox.width + delta
          }
        }))

        const groupRightBoundResizePatch = calcGroupRightBoundResizePatch(resizeState, cursor)

        return shapes.map((shape) => {
          if (shape.client.isSelected && shape.kind === "rectangle") {
            const found = groupRightBoundResizePatch.find(item => item.id === shape.id) as typeof groupRightBoundResizePatch[number]

            return {
              ...shape,
              geometry: {
                ...shape.geometry,
                ...found,
              }
            }
          }

          return shape
        })

        // return resizeShapesStrategy({
        //   proportional: moveEvent.shiftKey,
        //   reflow: moveEvent.ctrlKey,
        //   cursor,
        // })
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
    )

    const resizeCommit$ = rx.merge(pointerLeave$, pointerUp$).pipe(
      rx.withLatestFrom(viewState$),
      rx.filter(([_, state]) => isShapesResize(state)),
      rx.map(() => markDirtySelectedShapes(shapes$.getValue())),
      rx.tap(() => {
        viewState$.next(goToIdle({ selectedIds }))
        resetResizeCursor()
      })
    )

    return rx.merge(resizeActivation$, resizeProgress$, resizeCommit$)
  })
)