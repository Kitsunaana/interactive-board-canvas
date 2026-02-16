type AbstractConstructor<T = object> = new (...args: any[]) => T

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer R) => void
  ? R
  : never

type MixinInstances<T extends readonly AbstractConstructor[]> = UnionToIntersection<InstanceType<T[number]>>

export function Mixin<const T extends readonly AbstractConstructor[]>(...bases: T) {
  class Mixed {
    constructor(...args: any[]) {
      for (const Base of bases) {
        const instance = new Base(...args)
        Object.assign(this, instance)
      }
    }
  }

  for (const Base of bases) {
    for (const key of Reflect.ownKeys(Base.prototype)) {
      if (key === "constructor") continue
      const descriptor = Object.getOwnPropertyDescriptor(Base.prototype, key)
      if (descriptor) Object.defineProperty(Mixed.prototype, key, descriptor)
    }
  }

  type Result = abstract new (...args: any[]) => MixinInstances<T>

  return Mixed as unknown as Result
}