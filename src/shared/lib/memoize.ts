export const stableHash = (value: unknown): string => {
  if (value === null) return "null"

  if (typeof value !== "object") {
    return `${typeof value}:${value}`
  }

  if (Array.isArray(value)) {
    return `array:[${value.map(stableHash).join(",")}]`
  }

  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()

  return `object:{${keys
    .map(k => `${k}:${stableHash(obj[k])}`)
    .join(",")}}`
}

export const argsToKey = (args: unknown[]) => {
  return args.map(stableHash).join("|")
}

export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map<string, ReturnType<T>>()

  return function (...args: Parameters<T>) {
    const key = argsToKey(args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  } as T
}