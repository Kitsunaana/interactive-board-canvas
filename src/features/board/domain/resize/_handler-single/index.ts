import * as IndependentResize from "./_Independent"
import * as ProportionalResize from "./_proportional"

export const SingleViaCorner = {
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
  }
}