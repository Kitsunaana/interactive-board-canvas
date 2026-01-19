import * as IndependentResize from "./_independent-resize"
import * as ProportionalResize from "./_proportional-resize"

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
}
