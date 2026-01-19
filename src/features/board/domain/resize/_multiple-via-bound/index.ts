import * as IndependentReflow from "./_independent-reflow"
import * as ProportionalReflow from "./_proportional-reflow"

import * as IndependentResize from "./_independent-resize"
import * as ProportionalResize from "./_proportional-resize"

export * as IndependentResize from "./_independent-resize"
export * as ProportionalResize from "./_proportional-resize"

export const multiple = {
  resize: {
    independent: {
      bottom: IndependentResize.resizeFromBottomBound,
      right: IndependentResize.resizeFromRightBound,
      left: IndependentResize.resizeFromLeftBound,
      top: IndependentResize.resizeFromTopBound,
    },
    proportional: {
      bottom: ProportionalResize.resizeFromBottomBound,
      right: ProportionalResize.resizeFromRightBound,
      left: ProportionalResize.resizeFromLeftBound,
      top: ProportionalResize.resizeFromTopBound,
    },
  },
  reflow: {
    independent: {
      bottom: IndependentReflow.reflowFromRightBound,
      right: IndependentReflow.reflowFromRightBound,
      left: IndependentReflow.reflowFromLeftBound,
      top: IndependentReflow.reflowFromTopBound,
    },
    proportional: {
      bottom: ProportionalReflow.reflowFromRightBound,
      right: ProportionalReflow.reflowFromRightBound,
      left: ProportionalReflow.reflowFromLeftBound,
      top: ProportionalReflow.reflowFromTopBound,
    },
  },
}