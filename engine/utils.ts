export function mapKeys<R extends Record<string, unknown>, V>(
  record: R, 
  callback: <K extends keyof R>(key: K, value: R[K]) => V
) {
  return Object.keys(record).map((key) => {
    callback(key, record[key] as any)
  })
}

export const doubleClick = <T extends unknown[]>({click, dblclick, threshold}: {
  threshold: number
  click: (...args: T) => void
  dblclick: (...args: T) => void
}) => {
  let lastTime = 0

  return (...args: T) => {
    const currentTime = Date.now()
    const deltaTime = currentTime - lastTime
    lastTime = currentTime

    if (deltaTime <= threshold) dblclick(...args)
    else click(...args)
  }
}

export type AnyFunction = (...args: any[]) => any

export type ObjectEntry<T extends Record<string, unknown>> = {
  [K in keyof T]-?: {
    key: K,
    value: T[K]
  }
}[keyof T]

export const forEachObject = <R extends Record<string, unknown>>(
  object: R, callback: (entry: ObjectEntry<R>) => void
) => {
  Object.keys(object).forEach((key) => {
    callback({
      key,
      value: object[key],
    } as ObjectEntry<R>)
  })
}

