import { getRandFromId } from "@/shared/lib/seed.ts";
import type { Point, Rect } from "@/shared/type/shared.ts";
import * as _ from "lodash"
import { CONFIG } from "./const";
import { generateHachureLines, generateLayerOffsets, generateSketchyOutline } from "./generate";

export const generateSketchProps = <T extends Rect & { id: string }>({ rect, basePoints }: {
  basePoints: Point[]
  rect: T
}) => {
  const rand = getRandFromId(rect.id)

  const outlines = _.times(CONFIG.layers).map(() => generateSketchyOutline({ basePoints, rand }))

  const layerOffsets = generateLayerOffsets({ rand })
  const hachureLines = generateHachureLines({
    outlinePoints: outlines[0],
    offsetX: layerOffsets[0].x,
    offsetY: layerOffsets[0].y,
    rand,
  })

  return {
    hachureLines,
    layerOffsets,
    outlines,
  }
}
