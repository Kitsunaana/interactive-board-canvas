import * as IndependentReflow from "./_independent-reflow"
import * as ProportionalReflow from "./_proportional-reflow"

import * as IndependentResize from "./_independent-resize"
import * as ProportionalResize from "./_proportional-resize"

export const multiple = {
  resize: {
    independent: {
      bottom: IndependentResize.resizeFromBottomEdge,
      right: IndependentResize.resizeFromRightEdge,
      left: IndependentResize.resizeFromLeftEdge,
      top: IndependentResize.resizeFromTopEdge,
    },
    proportional: {
      bottom: ProportionalResize.resizeFromBottomEdge,
      right: ProportionalResize.resizeFromRightEdge,
      left: ProportionalResize.resizeFromLeftEdge,
      top: ProportionalResize.resizeFromTopEdge,
    },
  },
  reflow: {
    independent: {
      bottom: IndependentReflow.reflowFromRightEdge,
      right: IndependentReflow.reflowFromRightEdge,
      left: IndependentReflow.reflowFromLeftEdge,
      top: IndependentReflow.reflowFromTopEdge,
    },
    proportional: {
      bottom: ProportionalReflow.reflowFromRightEdge,
      right: ProportionalReflow.reflowFromRightEdge,
      left: ProportionalReflow.reflowFromLeftEdge,
      top: ProportionalReflow.reflowFromTopEdge,
    },
  },
}