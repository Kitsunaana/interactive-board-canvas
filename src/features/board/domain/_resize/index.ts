import { match } from "@/shared/lib/match"
import type { Point } from "@/shared/type/shared"
import { omit } from "lodash"
import type { SelectionBounds } from "../../modules/_pick-node/_core"
import type { Bound, Selection } from "../_selection/_selection.type"
import type { ShapeToView } from "../_shape"
import { reflow } from "./_multiple/_reflow"
import { resize } from "./_multiple/_resize"
import { independent } from "./_single/_independent"
import { proportional } from "./_single/_proportional"

type ResizeInteraction = {
  canvasPoint: Point

  proportional: boolean
  reflow: boolean
}

const single = {
  proportional,
  independent,
}

const multiple = {
  reflow,
  resize,
}

export const resizeSingleShape = ({ node, shapes }: {
  shapes: ShapeToView[]
  node: Bound
}) => {
  return match(node, {
    top: () => {
      return ({ proportional, canvasPoint }: ResizeInteraction) => {
        return proportional
          ? single.proportional.top({ cursor: canvasPoint, shapes })
          : single.independent.top({ cursor: canvasPoint, shapes })
      }
    },

    right: () => {
      return ({ proportional, canvasPoint }: ResizeInteraction) => {
        return proportional
          ? single.proportional.right({ cursor: canvasPoint, shapes })
          : single.independent.right({ cursor: canvasPoint, shapes })
      }
    },

    bottom: () => {
      return ({ proportional, canvasPoint }: ResizeInteraction) => {
        return proportional
          ? single.proportional.bottom({ cursor: canvasPoint, shapes })
          : single.independent.bottom({ cursor: canvasPoint, shapes })
      }
    },

    left: () => {
      return ({ proportional, canvasPoint }: ResizeInteraction) => {
        return proportional
          ? single.proportional.left({ cursor: canvasPoint, shapes })
          : single.independent.left({ cursor: canvasPoint, shapes })
      }
    },
  }, "id")
}

const resizeMultiShapes = ({ node, selectionBounds, ...params }: {
  selectionBounds: SelectionBounds
  shapes: ShapeToView[]
  node: Bound
}) => {
  return match(node, {
    top: () => ({ reflow, canvasPoint }: ResizeInteraction) => {
      return reflow
        ? multiple.reflow.top({ ...params, cursor: canvasPoint, selectionArea: selectionBounds.area })
        : multiple.resize.top({ ...params, cursor: canvasPoint, selectionArea: selectionBounds.area })
    },

    bottom: () => ({ reflow, canvasPoint }: ResizeInteraction) => {
      return reflow
        ? multiple.reflow.bottom({ ...params, cursor: canvasPoint, selectionArea: selectionBounds.area })
        : multiple.resize.bottom({ ...params, cursor: canvasPoint, selectionArea: selectionBounds.area })
    },

    right: () => {
      return ({ reflow, canvasPoint }: ResizeInteraction) => reflow
        ? multiple.reflow.right({ ...params, cursor: canvasPoint, selectionArea: selectionBounds.area })
        : multiple.resize.right({ ...params, cursor: canvasPoint, selectionArea: selectionBounds.area })
    },

    left: () => {
      return ({ reflow, canvasPoint }: ResizeInteraction) => reflow
        ? multiple.reflow.left({ ...params, cursor: canvasPoint, selectionArea: selectionBounds.area })
        : multiple.resize.left({ ...params, cursor: canvasPoint, selectionArea: selectionBounds.area })
    }
  }, "id")
}

export const getShapesResizeStrategy = (params: {
  selectionBounds: SelectionBounds
  selectedIds: Selection
  shapes: ShapeToView[]
  node: Bound
}) => {
  return params.selectedIds.size > 1
    ? resizeMultiShapes(params)
    : resizeSingleShape(omit(params, "selectionBounds"))
}