export const toRGB = (red: number, green: number, blue: number) => {
  return `rgb(${red},${green},${blue})`
}

export const generateRandomColor = () => {
  const red = Math.trunc(Math.random() * 255)
  const green = Math.trunc(Math.random() * 255)
  const blue = Math.trunc(Math.random() * 255)

  return toRGB(red, green, blue)
}