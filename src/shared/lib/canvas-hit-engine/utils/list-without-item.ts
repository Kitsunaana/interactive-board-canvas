export const getListWithoutItem = <T>(list: T[], candidate: T): T[] => {
  const index = list.indexOf(candidate)
  return list.slice(0, index).concat(list.slice(index + 1))
}