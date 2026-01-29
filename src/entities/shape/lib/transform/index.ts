import * as MultipleReflowIndependent from "./_reflow/_independent-multiple"
import * as MultipleReflowProportional from "./_reflow/_proportional-multiple"

import * as MultipleResizeIndependent from "./_resize/_independent-multiple"
import * as MultipleResizeProportional from "./_resize/_proportional-multiple"

import * as SingleResizeIndependent from "./_resize/_independent-single-from-bound"
import * as SingleResizeProportional from "./_resize/_proportional-single-from-bound"

export const TransformDomain = {
  Multiple: {
    Reflow: {
      Independent: MultipleReflowIndependent,
      Proportional: MultipleReflowProportional
    },
    Resize: {
      Independent: MultipleResizeIndependent,
      Proportional: MultipleResizeProportional,
    },
  },

  Single: {
    Resize: {
      Independent: SingleResizeIndependent,
      Proportional: SingleResizeProportional,
    },
  },
}
