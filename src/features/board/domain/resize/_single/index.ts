import * as IndependentResize from "./_independent"
import * as ProportionalResize from "./_proportional"

export const single = {
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
}