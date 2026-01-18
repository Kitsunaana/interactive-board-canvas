import * as IndependentResize from "./_Independent"

export const SingleViaCorner = {
  resize: {
    independent: {
      bottomRight: IndependentResize.resizeFromBottomRightCorner,
      bottomLeft: IndependentResize.resizeFromBottomLeftCorner,
      topRight: IndependentResize.resizeFromTopRightCorner,
      topLeft: IndependentResize.resizeFromTopLeftCorner,
    },
    proportional: {
      // bottom: ProportionalResize.resizeFromBottomEdge,
      // right: ProportionalResize.resizeFromRightEdge,
      // left: ProportionalResize.resizeFromLeftEdge,
      // top: ProportionalResize.resizeFromTopEdge,
    },
  }
}