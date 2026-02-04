import type { GroupResizeState } from "@/features/board/model/resize/_get-group-resize-state"
import { SELECTION_BOUNDS_PADDING } from "../../_const"
import type { Point } from "@/shared/type/shared"
import { isNotUndefined } from "@/shared/lib/utils"

const calcGroupTopRightCornerResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialWidth, initialHeight, pivotX, pivotY, shapes } = state

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const nextWidth = correctedCursorX - pivotX
  const nextHeight = pivotY - correctedCursorY

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const widthNormal = nextWidth > 0
  const widthFreeze = -nextWidth <= padding2

  const widthValue = widthNormal ? nextWidth : widthFreeze ? 0 : -nextWidth - padding2

  const scaleX = initialWidth === 0 ? 1 : widthValue / initialWidth
  const flipX = !widthNormal && !widthFreeze

  const heightNormal = nextHeight > 0
  const heightFreeze = -nextHeight <= padding2

  const heightValue = heightNormal ? nextHeight : heightFreeze ? 0 : -nextHeight - padding2

  const scaleY = initialHeight === 0 ? 1 : heightValue / initialHeight
  const flipY = !heightNormal && !heightFreeze

  return shapes.map((shape) => {
    if (isNotUndefined(shape.points)) {
      return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => {
          const dx = point.x - pivotX
          const dy = pivotY - point.y

          return {
            x: flipX ? pivotX - dx * scaleX : pivotX + dx * scaleX,
            y: flipY ? pivotY + dy * scaleY : pivotY - dy * scaleY,
          }
        }),
      }
    }

    const nextCenterX = flipX ? pivotX - shape.offsetX * scaleX : pivotX + shape.offsetX * scaleX

    const nextCenterY = flipY
      ? pivotY + shape.offsetY * scaleY
      : pivotY - shape.offsetY * scaleY

    const nextWidthShape = shape.width * scaleX
    const nextHeightShape = shape.height * scaleY

    return {
      id: shape.id,
      x: nextCenterX - nextWidthShape / 2,
      y: nextCenterY - nextHeightShape / 2,
      width: nextWidthShape,
      height: nextHeightShape,
      rotate: shape.rotate,
    }
  })
}

const calcGroupTopLeftCornerResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialWidth, initialHeight, pivotX, pivotY, shapes } = state

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const nextWidth = pivotX - correctedCursorX
  const nextHeight = pivotY - correctedCursorY

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const widthNormal = nextWidth > 0
  const widthFreeze = -nextWidth <= padding2

  const widthValue = widthNormal ? nextWidth : widthFreeze ? 0 : -nextWidth - padding2

  const scaleX = initialWidth === 0 ? 1 : widthValue / initialWidth
  const flipX = !widthNormal && !widthFreeze

  const heightNormal = nextHeight > 0
  const heightFreeze = -nextHeight <= padding2

  const heightValue = heightNormal ? nextHeight : heightFreeze ? 0 : -nextHeight - padding2

  const scaleY = initialHeight === 0 ? 1 : heightValue / initialHeight
  const flipY = !heightNormal && !heightFreeze

  return shapes.map((shape) => {
    if (isNotUndefined(shape.points)) {
      return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => {
          const dx = pivotX - point.x
          const dy = pivotY - point.y

          return {
            x: flipX ? pivotX + dx * scaleX : pivotX - dx * scaleX,
            y: flipY ? pivotY + dy * scaleY : pivotY - dy * scaleY,
          }
        }),
      }
    }

    const nextCenterX = flipX ? pivotX + shape.offsetX * scaleX : pivotX - shape.offsetX * scaleX
    const nextCenterY = flipY ? pivotY + shape.offsetY * scaleY : pivotY - shape.offsetY * scaleY

    const nextWidthShape = shape.width * scaleX
    const nextHeightShape = shape.height * scaleY

    return {
      id: shape.id,
      x: nextCenterX - nextWidthShape / 2,
      y: nextCenterY - nextHeightShape / 2,
      width: nextWidthShape,
      height: nextHeightShape,
      rotate: shape.rotate,
    }
  })
}

const calcGroupBottomLeftCornerResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialWidth, initialHeight, pivotX, pivotY, shapes } = state

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const rawWidth = pivotX - correctedCursorX
  const rawHeight = correctedCursorY - pivotY

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const isWidthNormal = rawWidth > 0
  const isWidthFreeze = -rawWidth <= padding2

  const width = isWidthNormal ? rawWidth : isWidthFreeze ? 0 : -rawWidth - padding2
  const widthSign = isWidthNormal ? 1 : isWidthFreeze ? 1 : -1

  const scaleX = initialWidth === 0 ? 1 : width / initialWidth

  const isHeightNormal = rawHeight > 0
  const isHeightFreeze = -rawHeight <= padding2

  const height = isHeightNormal ? rawHeight : isHeightFreeze ? 0 : -rawHeight - padding2
  const heightSign = isHeightNormal ? 1 : isHeightFreeze ? 1 : -1

  const scaleY = initialHeight === 0 ? 1 : height / initialHeight

  return shapes.map((shape) => {
    const nextCenterX = pivotX + shape.offsetX * scaleX * widthSign
    const nextCenterY = pivotY + shape.offsetY * scaleY * heightSign

    const nextWidthShape = shape.width * scaleX
    const nextHeightShape = shape.height * scaleY

    if (isNotUndefined(shape.points)) {
      return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => ({
          x: pivotX + (point.x - pivotX) * scaleX * widthSign,
          y: pivotY + (point.y - pivotY) * scaleY * heightSign,
        })),
      }
    }

    return {
      id: shape.id,
      x: nextCenterX - nextWidthShape / 2,
      y: nextCenterY - nextHeightShape / 2,
      width: nextWidthShape,
      height: nextHeightShape,
      rotate: shape.rotate,
    }
  })
}

const calcGroupBottomRightCornerResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialWidth, initialHeight, pivotX, pivotY, shapes } = state

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const rawWidth = correctedCursorX - pivotX
  const rawHeight = correctedCursorY - pivotY

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const isWidthNormal = rawWidth > 0
  const isWidthFreeze = -rawWidth <= padding2

  const width = isWidthNormal ? rawWidth : isWidthFreeze ? 0 : -rawWidth - padding2
  const widthSign = isWidthNormal ? 1 : isWidthFreeze ? 1 : -1

  const scaleX = initialWidth === 0 ? 1 : width / initialWidth

  const isHeightNormal = rawHeight > 0
  const isHeightFreeze = -rawHeight <= padding2

  const height = isHeightNormal ? rawHeight : isHeightFreeze ? 0 : -rawHeight - padding2
  const heightSign = isHeightNormal ? 1 : isHeightFreeze ? 1 : -1

  const scaleY = initialHeight === 0 ? 1 : height / initialHeight

  return shapes.map((shape) => {
    const nextCenterX = pivotX + shape.offsetX * scaleX * widthSign
    const nextCenterY = pivotY + shape.offsetY * scaleY * heightSign

    const nextWidthShape = shape.width * scaleX
    const nextHeightShape = shape.height * scaleY

    if (isNotUndefined(shape.points)) {
      return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => ({
          x: pivotX + (point.x - pivotX) * scaleX * widthSign,
          y: pivotY + (point.y - pivotY) * scaleY * heightSign,
        })),
      }
    }

    return {
      id: shape.id,
      x: nextCenterX - nextWidthShape / 2,
      y: nextCenterY - nextHeightShape / 2,
      width: nextWidthShape,
      height: nextHeightShape,
      rotate: shape.rotate,
    }
  })
}

export const independentGroupResizeFromCorner = {
  bottomRight: calcGroupBottomRightCornerResizePatch,
  bottomLeft: calcGroupBottomLeftCornerResizePatch,
  topRight: calcGroupTopRightCornerResizePatch,
  topLeft: calcGroupTopLeftCornerResizePatch,
}