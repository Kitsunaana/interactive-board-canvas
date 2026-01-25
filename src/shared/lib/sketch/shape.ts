import { getRandFromId } from "@/shared/lib/seed.ts";
import type { Point, RectWithId } from "@/shared/type/shared.ts";
import * as _ from "lodash";
import { CONFIG } from "./const";
import { generateHachureLines, generateLayerOffsets, generateSketchyOutline } from "./generate";

export const generateSketchProps = <T extends RectWithId>({ rect, basePoints }: {
  basePoints: Point[]
  rect: T
}) => {
  const rand = getRandFromId(rect.id)

  const outlines = _.times(CONFIG.layers).map(() => generateSketchyOutline({ basePoints, rand }))

  const layerOffsets = generateLayerOffsets({ rand })
  const firtLayerOffset = layerOffsets[0]

  const hachureLines = generateHachureLines({
    outlinePoints: outlines[0],
    offsetX: firtLayerOffset.x,
    offsetY: firtLayerOffset.y,
    rand,
  })

  return {
    hachureLines,
    layerOffsets,
    outlines,
  }
}
