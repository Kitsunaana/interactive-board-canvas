export function mapKeys<R extends Record<string, unknown>, V>(
  record: R, 
  callback: <K extends keyof R>(key: K, value: R[K]) => V
) {
  return Object.keys(record).map((key) => {
    callback(key, record[key] as any)
  })
}