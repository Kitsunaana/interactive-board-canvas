import { getBoundingBox } from "@/entities/shape/model/get-bounding-box"
import type { ClientShape, PathGeometry, RectangleGeometry } from "@/entities/shape/model/types"
import { calculateAABBFromRects, centerPointFromRect, getAABBSize } from "@/shared/lib/rect"
import type { Point, Rect } from "@/shared/type/shared"
import type { RotateableShapesStrategy } from "./rotate-interface"
import { getAngleBetweenPoints } from "@/shared/lib/point"
import { markDirtySelectedShapes } from "@/entities/shape/model/render-state"
import { goToShapesRotate, type ShapesRotateViewState } from "../../view-model/state/_view-model.type"
import type { Selection } from "../../domain/selection"
import { mapSelectedShapes } from "../resize/_strategy/_lib"

type ExtractedRectangleData = {
  x: number
  y: number
  id: string
  rotate: number
  centerX: number
  centerY: number
  offsetX: number
  offsetY: number
}

type RotationDeltaState = {
  currentAngle: number
  deltaAngle: number
  cos: number
  sin: number
}

export const extractSelectedRectanglesData = (shapes: ClientShape[], centerArea: Point) => {
  return shapes.reduce((acc, shape) => {
    if (shape.client.isSelected) {
      const bbox = getBoundingBox(shape.geometry, 0)

      const centerX = bbox.x + bbox.width / 2
      const centerY = bbox.y + bbox.height / 2

      const offsetX = centerX - centerArea.x
      const offsetY = centerY - centerArea.y

      acc[shape.id] = {
        rotate: shape.transform.rotate,
        id: shape.id,
        x: bbox.x,
        y: bbox.y,
        centerX,
        centerY,
        offsetX,
        offsetY,
      }
    }

    return acc
  }, {} as Record<string, ExtractedRectangleData>)
}

const getRotateAroundSelectionArea = (area: Rect) => {
  const center = centerPointFromRect(area)

  const rotateShapePath = (path: PathGeometry, rotationDelta: RotationDeltaState, metadata: ExtractedRectangleData) => {
    const rotatedPoints = path.points.map((point) => {
      const dx = point.x - center.x
      const dy = point.y - center.y

      return {
        x: center.x + dx * rotationDelta.cos - dy * rotationDelta.sin,
        y: center.y + dx * rotationDelta.sin + dy * rotationDelta.cos,
      }
    })

    const nextRotate = metadata.rotate + rotationDelta.deltaAngle

    return [
      nextRotate,
      {
        ...path,
        points: rotatedPoints,
      }
    ] as const
  }

  const rotateShapeRectangle = (rect: Rect, rotationDelta: RotationDeltaState, metadata: ExtractedRectangleData) => {
    const nextRotate = metadata.rotate + rotationDelta.deltaAngle

    const rotatedOffsetX = metadata.offsetX * rotationDelta.cos - metadata.offsetY * rotationDelta.sin
    const rotatedOffsetY = metadata.offsetX * rotationDelta.sin + metadata.offsetY * rotationDelta.cos

    const nextCenterX = center.x + rotatedOffsetX
    const nextCenterY = center.y + rotatedOffsetY

    const nextX = nextCenterX - rect.width / 2
    const nextY = nextCenterY - rect.height / 2

    return [
      nextRotate,
      {
        ...rect,
        x: nextX,
        y: nextY,
        kind: "rectangle-geometry",
      },
    ] as const
  }

  return {
    rectangle: rotateShapeRectangle,
    pen: rotateShapePath,
  }
}

export const getMultipleShapesRotateStrategy: RotateableShapesStrategy = ({ area, shapes, startCursor }) => {
  const initialCenter = centerPointFromRect(area)
  const startAngle = getAngleBetweenPoints(initialCenter, startCursor)

  const shapesToRotate = shapes.filter((shape) => shape.client.isSelected)
  const extractedMetadata = extractSelectedRectanglesData(shapes, initialCenter)

  const initialBoundingBox = getAABBSize(
    calculateAABBFromRects(shapesToRotate.map((shape) => getBoundingBox(shape.geometry, shape.transform.rotate)))
  )

  const rotateAroundSelectionArea = getRotateAroundSelectionArea(area as RectangleGeometry)

  new Promise(() => {
    shapesToRotate.forEach((shape) => {
      shape.client.renderMode.kind = "vector"
    })
  })

  return {
    finish: () => {
      markDirtySelectedShapes(shapesToRotate)
    },

    goToRotate: (selectedIds: Selection) => goToShapesRotate({
      selectedIds,
      selection: {
        bounds: shapesToRotate.map((shape) => ({
          ...getBoundingBox(shape.geometry, 0),
          rotate: shape.transform.rotate,
          id: shape.id,
        })),
        area: {
          ...initialBoundingBox,
          rotate: 0,
        },
      }
    }),

    rotate: ({ currentCursor }) => {
      const currentAngle = getAngleBetweenPoints(initialCenter, currentCursor)
      const deltaAngle = currentAngle - startAngle

      const cos = Math.cos(deltaAngle)
      const sin = Math.sin(deltaAngle)

      const rotationDelta: RotationDeltaState = {
        currentAngle,
        deltaAngle,
        cos,
        sin,
      }

      return {
        nextState: (state: ShapesRotateViewState) => goToShapesRotate({
          ...state,
          selection: {
            bounds: state.selection.bounds.map((bound) => {
              const [nextRotate, nextGeometry] = rotateAroundSelectionArea.rectangle(bound, rotationDelta, extractedMetadata[bound.id])

              return {
                ...nextGeometry,
                id: bound.id,
                rotate: nextRotate,
              }
            }),
            area: {
              ...initialBoundingBox,
              rotate: deltaAngle,
            }
          }
        }),

        nextShapes: () => {
          return mapSelectedShapes(shapes, (shape) => {
            const metadata = extractedMetadata[shape.id]

            let geometry = shape.geometry
            let rotate = metadata.rotate

            switch (shape.kind) {
              case "rectangle":
              case "image": {
                [rotate, geometry] = rotateAroundSelectionArea.rectangle(shape.geometry, rotationDelta, metadata)
                break
              }

              case "arrow":
              case "line":
              case "pen": {
                [, geometry] = rotateAroundSelectionArea.pen(shape.geometry, rotationDelta, metadata)
                break
              }
            }

            return {
              ...shape,
              geometry,
              transform: {
                ...shape.transform,
                rotate,
              }
            } as ClientShape
          })
        }
      }
    }
  }
}
