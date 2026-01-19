import * as IndependentResize from "./_independent-resize"
import * as ProportionalResize from "./_proportional-resize"

import * as IndependentReflow from "./_independent-reflow"

export const MultipleViaHandler = {
  resize: {
    independent: {
      bottomRight: IndependentResize.resizeFromBottomRightCorner,
      bottomLeft: IndependentResize.resizeFromBottomLeftCorner,
      topRight: IndependentResize.resizeFromTopRightCorner,
      topLeft: IndependentResize.resizeFromTopLeftCorner,
    },
    proportional: {
      bottomRight: ProportionalResize.resizeFromBottomRightCorner,
      bottomLeft: ProportionalResize.resizeFromBottomLeftCorner,
      topRight: ProportionalResize.resizeFromTopRightCorner,
      topLeft: ProportionalResize.resizeFromTopLeftCorner,
    },
  },
  reflow: {
    independent: {
      bottomRight: IndependentReflow.reflowFromBottomRightCorner,
      bottomLeft: IndependentReflow.reflowFromBottomLeftCorner,
      topRight: IndependentReflow.reflowFromTopRightCorner,
      topLeft: IndependentReflow.reflowFromTopLeftCorner,
    },
    proportional: {
      bottomRight: ProportionalResize.resizeFromBottomRightCorner,
      bottomLeft: ProportionalResize.resizeFromBottomLeftCorner,
      topRight: ProportionalResize.resizeFromTopRightCorner,
      topLeft: ProportionalResize.resizeFromTopLeftCorner,
    },
  },
}
