export const isNotNull = <T>(value: T): value is NonNullable<T> => value !== null

export const isNegative = (value: number) => value < 0

export const getCanvasSizes = () => ({
    height: window.innerHeight,
    width: window.innerWidth,
})