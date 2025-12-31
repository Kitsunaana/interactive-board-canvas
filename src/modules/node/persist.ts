import { isNil } from "lodash";
import type { Point } from "../../type";

export const CONFIG = {
  baseOpacity: 0.8,
  roughness: 4,
  maxOffset: 4,
  layers: 2,

  hachureRoughness: 4,
  hachureOpacity: 0.2,
  hachureLayers: 2,
  hachureAngle: 45,
  hachureGap: 9,
};

export const getRandomPoint = (): Point => ({
  x: Math.random(),
  y: Math.random(),
})

export const persist = {
  wobblyLine: {
    record: {} as Record<string, Record<string, Record<string, { one: Point, two: Point }>>>,

    addHachureLines({ line, step }: { line: number, step: number }) {
      const values = persist.wobblyLine.record

      if (isNil(values[line])) values[line] = {}
      if (isNil(values[line][step])) values[line][step] = {}
    },

    addOrGetWobblyLine({ line, step, segment }: { segment: number; line: number; step: number }) {
      const readLayer = persist.wobblyLine.record[line][step]

      if (isNil(readLayer[segment])) {
        persist.wobblyLine.record[line][step][segment] = {
          one: getRandomPoint(),
          two: getRandomPoint()
        }
      }

      return readLayer[segment]
    }
  },

  sketchOutline: {
    record: {} as Record<string, Record<string, Point>>,

    addOutline({ outline }: { outline: number }) {
      if (isNil(persist.sketchOutline.record[outline])) {
        persist.sketchOutline.record[outline] = {}
      }
    },

    addOrGetPoints({ outline, index }: { outline: number, index: number }) {
      const outlineRecord = persist.sketchOutline.record[outline]

      if (isNil(outlineRecord[index])) {
        outlineRecord[index] = getRandomPoint()
      }

      return outlineRecord[index]
    },
  },

  layerOffsets: {
    record: {} as Record<string, Record<string, Point>>,

    addLayerOffsets({ layerOffset }: { layerOffset: number }) {
      if (isNil(persist.layerOffsets.record[layerOffset])) {
        persist.layerOffsets.record[layerOffset] = {}
      }
    },

    addOrGetLayerOffset({ layerOffset, index }: { layerOffset: number, index: number }) {
      if (isNil(persist.layerOffsets.record[layerOffset][index])) {
        persist.layerOffsets.record[layerOffset][index] = getRandomPoint()
      }

      return persist.layerOffsets.record[layerOffset][index]
    }
  }
}