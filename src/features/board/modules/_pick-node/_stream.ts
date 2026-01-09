import { generateRandomColor } from "@/shared/lib/color.ts";
import { matchEither } from "@/shared/lib/either.ts";
import { initialCanvas } from "@/shared/lib/initial-canvas.ts";
import { isNotNull, isNotUndefined } from "@/shared/lib/utils.ts";
import type { Point, Rect } from "@/shared/type/shared.ts";
import { isNil } from "lodash";
import { map, Observable, shareReplay, tap, withLatestFrom } from "rxjs";
import { shapes$ } from "../../domain/node.ts";
import { selectionBounds$ } from "../../view-model/state/index-v2.ts";
import { camera$ } from "../_camera/_stream.ts";
import { context, getPickedColor } from "./_core.ts";
import { renderHelperShapes } from "./_loop.ts";

export const [_, canvas] = initialCanvas({
  height: window.innerHeight,
  width: window.innerWidth,
  canvasId: "canvas",
})

type BoundLinesColor = {
  bottom: string
  right: string
  left: string
  top: string
}

export const selectionBoundsToPicked$ = selectionBounds$.pipe(map((selectionBounds) => matchEither(selectionBounds, {
  left: () => null,
  right: (value) => ({
    area: value.main,
    bounds: value.rects,
    linesColor: {
      bottom: generateRandomColor(),
      right: generateRandomColor(),
      left: generateRandomColor(),
      top: generateRandomColor(),
    }
  }),
})))

const canvasColorId = generateRandomColor()

export const createPointerNodePick$ = (pointer$: Observable<PointerEvent>) =>
  pointer$.pipe(
    withLatestFrom(shapes$, camera$, selectionBoundsToPicked$),
    map(([event, shapes, camera, selectionBounds]) => ({ event, shapes, camera, context, selectionBounds })),
    tap(({ camera, context, shapes, selectionBounds }) => {
      context.save()

      context.clearRect(0, 0, context.canvas.width, context.canvas.height)

      context.translate(camera.x, camera.y)
      context.scale(camera.scale, camera.scale)

      context.save()
      context.fillStyle = canvasColorId
      context.rect(-camera.x, -camera.y, context.canvas.width, context.canvas.height)
      context.fill()
      context.restore()

      renderHelperShapes({ context, shapes })

      if (isNotNull(selectionBounds)) {
        drawHelperSelectionBounds({
          lineColors: selectionBounds.linesColor,
          rect: selectionBounds.area,
          context,
        })
      }

      context.restore()
    }),
    map(({ camera, context, event, shapes, selectionBounds }) => {
      const { colorId, point } = getPickedColor({ context, camera, event })
      const format = createFormaterFoundNode({ colorId, point, event })

      if (colorId === canvasColorId) {
        return format({
          type: "grid" as const,
          id: "grid",
        })
      }

      if (isNotNull(selectionBounds)) {
        const bound = Object
          .entries(selectionBounds.linesColor)
          .find(([_, boundColorId]) => boundColorId === colorId)

        if (isNotUndefined(bound)) {
          return format({
            type: "bound" as const,
            id: bound[0] as "top" | "right" | "bottom" | "left",
          })
        }
      }

      const node = shapes.find((node) => node.colorId === colorId) ?? {
        type: "grid" as const,
        id: "grid",
      }

      if (isNil(node)) {
        throw new Error("node not found")
      }

      return format(node)
    }),
    shareReplay({ refCount: true, bufferSize: 1 }),
  )

function createFormaterFoundNode({ colorId, event, point }: {
  event: PointerEvent
  colorId: string
  point: Point
}) {
  return <T>(node: T) => {
    return {
      colorId,
      point,
      event,
      node,
    }
  }
}

const padding = 7

export const drawHelperSelectionBounds = ({ context, lineColors, rect }: {
  context: CanvasRenderingContext2D
  lineColors: BoundLinesColor
  rect: Rect
}) => {
  context.save()

  context.lineWidth = 7

  context.beginPath()
  context.strokeStyle = lineColors.top
  context.moveTo(rect.x - padding, rect.y - padding)
  context.lineTo(rect.x + rect.width + padding, rect.y - padding)
  context.stroke()
  context.closePath()

  context.beginPath()
  context.strokeStyle = lineColors.right
  context.moveTo(rect.x + rect.width + padding, rect.y - padding)
  context.lineTo(rect.x + rect.width + padding, rect.y + rect.height + padding)
  context.stroke()
  context.closePath()

  context.beginPath()
  context.strokeStyle = lineColors.bottom
  context.moveTo(rect.x + rect.width + padding, rect.y + rect.height + padding)
  context.lineTo(rect.x - padding, rect.y + rect.height + padding)
  context.stroke()
  context.closePath()

  context.beginPath()
  context.strokeStyle = lineColors.left
  context.moveTo(rect.x - padding, rect.y + rect.height + padding)
  context.lineTo(rect.x - padding, rect.y - padding)
  context.stroke()
  context.closePath()

  context.restore()
}