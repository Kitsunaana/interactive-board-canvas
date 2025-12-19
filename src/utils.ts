export const isNotNull = <T>(value: T): value is NonNullable<T> => value !== null

export const isNegative = (value: number) => value < 0

export const getCanvasSizes = () => ({
  height: window.innerHeight,
  width: window.innerWidth,
})

export const getBoundingClientRect = (event: PointerEvent) => (
  (event.target as HTMLElement).getBoundingClientRect()
)

export const isHtmlElement = (node: unknown) => node instanceof HTMLElement