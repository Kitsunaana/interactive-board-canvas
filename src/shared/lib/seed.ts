export const mulberry32 = (seed: number) => {
  let t = seed

  return function random() {
    t += 0x6D2B79F5

    let r = Math.imul(t ^ (t >>> 15), t | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)

    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(value: string): number {
  let hash = 2166136261
  const str = String(value)

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export const GLOBAL_SEED = 1333

export function getRandFromId(id: string) {
  const seed = hashSeed(id) ^ GLOBAL_SEED
  const rand = mulberry32(seed)

  return rand
}
