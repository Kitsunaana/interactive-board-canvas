import { defaultTo } from "lodash";

export const withDefaultTransformHandlers = <T extends object | undefined>(transform: T) => ({
  default: () => ({}),
  frizen: () => ({}),
  flip: () => ({}),

  ...defaultTo(transform, {} as NonNullable<T>)
})