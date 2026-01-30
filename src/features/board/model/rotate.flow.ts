import { getBoundingBox } from "@/entities/shape/model/get-bounding-box";
import { markDirty, markDirtySelectedShapes } from "@/entities/shape/model/render-state";
import type { ClientShape } from "@/entities/shape/model/types";
import { getAngleBetweenPoints, getPointFromEvent, screenToCanvasV2 } from "@/shared/lib/point";
import { calculateLimitPointsFromRects, centerPointFromRect, getAABBSize } from "@/shared/lib/rect";
import { _u, isNotNull } from "@/shared/lib/utils";
import type { Point, Rect } from "@/shared/type/shared";
import * as rx from "rxjs";
import { camera$ } from "../modules/camera";
import { mouseDown$, pointerLeave$, pointerMove$, pointerUp$ } from "../modules/pick-node";
import { selectionBounds$ } from "../view-model/selection-bounds";
import { isIdle, shapesToRender$, viewState$ } from "../view-model/state";
import { goToShapesRotate, isShapesRotate, type IdleViewState, type ShapesRotateViewState } from "../view-model/state/_view-model.type";

type RotateableShapesStrategyParams = {
  startCursor: Point
  idleState: IdleViewState
  shapes: ClientShape[]
  area: Rect
}

type RotateableShapesStrategyRotateParams = {
  state: ShapesRotateViewState
  currentCursor: Point
}

type RotateableShapesStrategy = (params: RotateableShapesStrategyParams) => {
  rotate: (params: RotateableShapesStrategyRotateParams) => ClientShape[]
  close: () => void
}

const getSingleShapeRotateStrategy: RotateableShapesStrategy = ({ area, shapes, startCursor }) => {
  const center = centerPointFromRect(area)

  const startCursorAngle = getAngleBetweenPoints(center, startCursor)
  const rotatingShape = shapes.find((shape) => shape.client.isSelected) as ClientShape
  const startRotation = rotatingShape.transform.rotate

  rotatingShape.client.renderMode.kind = "vector"

  viewState$.next(goToShapesRotate({
    boundingBox: getBoundingBox(rotatingShape.geometry, 0),
    selectedIds: new Set([rotatingShape.id]),
    rotate: rotatingShape.transform.rotate,
  }))

  return {
    close: () => markDirty(rotatingShape),

    rotate: ({ currentCursor, state }) => {
      const currentCursorAngle = getAngleBetweenPoints(center, currentCursor)

      const delta = currentCursorAngle - startCursorAngle
      const nextRotation = startRotation + delta

      viewState$.next(goToShapesRotate({ ...state, rotate: delta + rotatingShape.transform.rotate }))

      return shapes.map((shape) => {
        if (shape.client.isSelected) {
          return {
            ...shape,
            transform: _u.merge(shape.transform, { rotate: nextRotation })
          }
        }

        return shape
      })
    }
  }
}

const extractGeometryMetadata = (shape: ClientShape, center: Point) => {
  if (shape.geometry.kind !== "rectangle-geometry") {
    throw new Error("not supported")
  }

  const centerX = shape.geometry.x + shape.geometry.width / 2
  const centerY = shape.geometry.y + shape.geometry.height / 2

  return {
    id: shape.id,
    centerX,
    centerY,
    x: shape.geometry.x,
    y: shape.geometry.y,
    offsetX: centerX - center.x,
    offsetY: centerY - center.y,
  }
}

const extractSelectedRectanglesData = (shapes: ClientShape[], areaCenter: Point) => {
  const geometries = shapes.reduce((acc, shape) => {
    if (shape.client.isSelected && shape.geometry.kind === "rectangle-geometry") {
      acc[shape.id] = extractGeometryMetadata(shape, areaCenter)
    }

    return acc
  }, {} as Record<string, ReturnType<typeof extractGeometryMetadata>>)

  return geometries
}

const getMultipleShapesRotateStrategy: RotateableShapesStrategy = ({ area, shapes, idleState, startCursor }) => {
  const center = centerPointFromRect(area)
  const startCursorAngle = getAngleBetweenPoints(center, startCursor)

  const shapesToRotate = shapes.filter((shape) => shape.client.isSelected)

  const aabb = calculateLimitPointsFromRects({
    rects: shapesToRotate.map((shape) => {
      shape.client.renderMode.kind = "vector"

      return getBoundingBox(shape.geometry, shape.transform.rotate)
    })
  })

  const geometries = extractSelectedRectanglesData(shapes, center)

  const initialBoundingBox = getAABBSize({ minX: aabb.min.x, minY: aabb.min.y, maxX: aabb.max.x, maxY: aabb.max.y })

  viewState$.next(goToShapesRotate({
    selectedIds: idleState.selectedIds,
    boundingBox: initialBoundingBox,
    rotate: 0,
  }))

  return {
    close: () => {
      markDirtySelectedShapes(shapesToRotate)
    },

    rotate: ({ state, currentCursor }) => {
      const currentAngle = getAngleBetweenPoints(center, currentCursor)
      const deltaAngle = currentAngle - startCursorAngle

      const cos = Math.cos(deltaAngle)
      const sin = Math.sin(deltaAngle)

      viewState$.next(goToShapesRotate({ ...state, rotate: deltaAngle }))

      return shapes.map((shape) => {
        if (shape.client.isSelected && shape.geometry.kind === "rectangle-geometry") {
          const initial = geometries[shape.id]

          const nextRotate = shape.transform.rotate + deltaAngle

          const rotatedOffsetX = initial.offsetX * cos - initial.offsetY * sin
          const rotatedOffsetY = initial.offsetX * sin + initial.offsetY * cos

          const nextCenterX = center.x + rotatedOffsetX
          const nextCenterY = center.y + rotatedOffsetY

          const nextX = nextCenterX - shape.geometry.width / 2
          const nextY = nextCenterY - shape.geometry.height / 2

          return {
            ...shape,
            geometry: {
              ...shape.geometry,
              x: nextX,
              y: nextY,
            },
            transform: {
              ...shape.transform,
              rotate: nextRotate,
            }
          }
        }

        return shape
      }) as ClientShape[]
    }
  }
}

export const shapesRotateFlow$ = mouseDown$.pipe(
  rx.filter((event) => event.node.type === "rotate-handler"),

  rx.withLatestFrom(
    viewState$.pipe(rx.filter(isIdle)),
    selectionBounds$.pipe(rx.filter(isNotNull), rx.map((value) => value.area)),
    shapesToRender$,
    camera$,
  ),

  rx.switchMap(([{ event }, idleState, area, shapes, camera]) => {
    const startCursor = screenToCanvasV2(getPointFromEvent(event), camera)

    const shapeRotateStrategy = (idleState.selectedIds.size > 1 ? getMultipleShapesRotateStrategy : getSingleShapeRotateStrategy)({
      area, shapes, idleState, startCursor
    })

    return pointerMove$.pipe(
      rx.withLatestFrom(viewState$.pipe(rx.filter(isShapesRotate))),
      rx.map(([event, state]) => {
        const currentCursor = screenToCanvasV2(getPointFromEvent(event), camera)

        return shapeRotateStrategy.rotate({ state, currentCursor })
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$).pipe(rx.tap(() => {
        shapeRotateStrategy.close()
      })))
    )
  })
)
