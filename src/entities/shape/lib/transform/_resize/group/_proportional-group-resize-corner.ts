import type { GroupResizeState } from "@/features/board/model/resize/_get-group-resize-state"
import { SELECTION_BOUNDS_PADDING } from "../../_const"
import type { Point } from "@/shared/type/shared"
import { isNotUndefined } from "@/shared/lib/utils"

const calcGroupTopRightCornerAspectResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialWidth, initialHeight, pivotX, pivotY, shapes } = state

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const rawWidth = correctedCursorX - pivotX
  const rawHeight = pivotY - correctedCursorY

  const widthNormal = rawWidth > 0
  const widthFreeze = -rawWidth <= padding2
  const widthValue = widthNormal ? rawWidth : widthFreeze ? 0 : -rawWidth - padding2
  const widthSign = widthNormal ? 1 : widthFreeze ? 1 : -1

  const scaleX = initialWidth === 0 ? 1 : widthValue / initialWidth

  const heightNormal = rawHeight > 0
  const heightFreeze = -rawHeight <= padding2
  const heightValue = heightNormal ? rawHeight : heightFreeze ? 0 : -rawHeight - padding2
  const heightSign = heightNormal ? 1 : heightFreeze ? 1 : -1

  const scaleY = initialHeight === 0 ? 1 : heightValue / initialHeight

  const scale = Math.min(scaleX, scaleY)

  return shapes.map((shape) => {
    if (isNotUndefined(shape.points)) {
      return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => {
          const dx = point.x - pivotX
          const dy = pivotY - point.y
          return {
            x: widthSign === 1 ? pivotX + dx * scale : pivotX - dx * scale,
            y: heightSign === 1 ? pivotY - dy * scale : pivotY + dy * scale,
          }
        }),
      }
    }

    const localX = shape.x - pivotX
    const localY = pivotY - (shape.y + shape.height)

    const nextWidthShape = shape.width * scale
    const nextHeightShape = shape.height * scale

    const x = widthSign === 1 ? pivotX + localX * scale : pivotX - localX * scale - nextWidthShape
    const y = heightSign === 1 ? pivotY - localY * scale - nextHeightShape : pivotY + localY * scale

    return {
      id: shape.id,
      x,
      y,
      width: nextWidthShape,
      height: nextHeightShape,
      rotate: shape.rotate,
    }
  })
}

const calcGroupTopLeftCornerAspectResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialWidth, initialHeight, pivotX, pivotY, shapes } = state

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const rawWidth = pivotX - correctedCursorX
  const rawHeight = pivotY - correctedCursorY

  const widthNormal = rawWidth > 0
  const widthFreeze = -rawWidth <= padding2
  const widthValue = widthNormal ? rawWidth : widthFreeze ? 0 : -rawWidth - padding2
  const widthSign = widthNormal ? 1 : widthFreeze ? 1 : -1

  const scaleX = initialWidth === 0 ? 1 : widthValue / initialWidth

  const heightNormal = rawHeight > 0
  const heightFreeze = -rawHeight <= padding2
  const heightValue = heightNormal ? rawHeight : heightFreeze ? 0 : -rawHeight - padding2
  const heightSign = heightNormal ? 1 : heightFreeze ? 1 : -1

  const scaleY = initialHeight === 0 ? 1 : heightValue / initialHeight

  const scale = Math.min(scaleX, scaleY)

  return shapes.map((shape) => {
    if (isNotUndefined(shape.points)) {
      return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => {
          const dx = pivotX - point.x
          const dy = pivotY - point.y

          return {
            x: widthSign === 1 ? pivotX - dx * scale : pivotX + dx * scale,
            y: heightSign === 1 ? pivotY - dy * scale : pivotY + dy * scale,
          }
        }),
      }
    }

    const localX = pivotX - (shape.x + shape.width)
    const localY = pivotY - (shape.y + shape.height)

    const nextWidthShape = shape.width * scale
    const nextHeightShape = shape.height * scale

    const x = widthSign === 1 ? pivotX - localX * scale - nextWidthShape : pivotX + localX * scale
    const y = heightSign === 1 ? pivotY - localY * scale - nextHeightShape : pivotY + localY * scale

    return {
      id: shape.id,
      x,
      y,
      width: nextWidthShape,
      height: nextHeightShape,
      rotate: shape.rotate,
    }
  })
}

const calcGroupBottomLeftCornerAspectResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialWidth, initialHeight, pivotX, pivotY, shapes } = state

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const rawWidth = pivotX - correctedCursorX
  const rawHeight = correctedCursorY - pivotY

  const widthNormal = rawWidth > 0
  const widthFreeze = -rawWidth <= padding2
  const widthValue = widthNormal ? rawWidth : widthFreeze ? 0 : -rawWidth - padding2
  const widthSign = widthNormal ? 1 : widthFreeze ? 1 : -1

  const scaleX = initialWidth === 0 ? 1 : widthValue / initialWidth

  const heightNormal = rawHeight > 0
  const heightFreeze = -rawHeight <= padding2
  const heightValue = heightNormal ? rawHeight : heightFreeze ? 0 : -rawHeight - padding2
  const heightSign = heightNormal ? 1 : heightFreeze ? 1 : -1

  const scaleY = initialHeight === 0 ? 1 : heightValue / initialHeight

  const scale = Math.min(scaleX, scaleY)

  return shapes.map((shape) => {
    if (isNotUndefined(shape.points)) {
      return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => {
          const dx = pivotX - point.x
          const dy = point.y - pivotY

          return {
            x: widthSign === 1 ? pivotX - dx * scale : pivotX + dx * scale,
            y: heightSign === 1 ? pivotY + dy * scale : pivotY - dy * scale,
          }
        }),
      }
    }

    const localX = pivotX - (shape.x + shape.width)
    const localY = shape.y - pivotY

    const nextWidthShape = shape.width * scale
    const nextHeightShape = shape.height * scale

    const x = widthSign === 1 ? pivotX - localX * scale - nextWidthShape : pivotX + localX * scale
    const y = heightSign === 1 ? pivotY + localY * scale : pivotY - localY * scale - nextHeightShape

    return {
      id: shape.id,
      x,
      y,
      width: nextWidthShape,
      height: nextHeightShape,
      rotate: shape.rotate,
    }
  })
}

const calcGroupBottomRightCornerAspectResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialWidth, initialHeight, pivotX, pivotY, shapes } = state

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const rawWidth = correctedCursorX - pivotX
  const rawHeight = correctedCursorY - pivotY

  const widthNormal = rawWidth > 0
  const widthFreeze = -rawWidth <= padding2
  const widthValue = widthNormal ? rawWidth : widthFreeze ? 0 : -rawWidth - padding2
  const widthSign = widthNormal ? 1 : widthFreeze ? 1 : -1

  const scaleX = initialWidth === 0 ? 1 : widthValue / initialWidth

  const heightNormal = rawHeight > 0
  const heightFreeze = -rawHeight <= padding2
  const heightValue = heightNormal ? rawHeight : heightFreeze ? 0 : -rawHeight - padding2
  const heightSign = heightNormal ? 1 : heightFreeze ? 1 : -1

  const scaleY = initialHeight === 0 ? 1 : heightValue / initialHeight

  const scale = Math.min(scaleX, scaleY)

  return shapes.map((shape) => {
    if (isNotUndefined(shape.points)) {
      return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => {
          const dx = point.x - pivotX
          const dy = point.y - pivotY

          return {
            x: widthSign === 1 ? pivotX + dx * scale : pivotX - dx * scale,
            y: heightSign === 1 ? pivotY + dy * scale : pivotY - dy * scale,
          }
        }),
      }
    }

    const localX = shape.x - pivotX
    const localY = shape.y - pivotY

    const nextWidthShape = shape.width * scale
    const nextHeightShape = shape.height * scale

    const x = widthSign === 1 ? pivotX + localX * scale : pivotX - localX * scale - nextWidthShape
    const y = heightSign === 1 ? pivotY + localY * scale : pivotY - localY * scale - nextHeightShape

    return {
      id: shape.id,
      x,
      y,
      width: nextWidthShape,
      height: nextHeightShape,
      rotate: shape.rotate,
    }
  })
}

export const proportionalGroupResizeFromCorner = {
  bottomRight: calcGroupBottomRightCornerAspectResizePatch,
  bottomLeft: calcGroupBottomLeftCornerAspectResizePatch,
  topRight: calcGroupTopRightCornerAspectResizePatch,
  topLeft: calcGroupTopLeftCornerAspectResizePatch,
}