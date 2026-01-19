import * as IndependentResize from "./_independent"
import * as ProportionalResize from "./_proportional"

export * as IndependentResize from "./_independent"
export * as ProportionalResize from "./_proportional"

export const single = {
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
}