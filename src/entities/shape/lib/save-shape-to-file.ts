export const saveCanvasToFile = (canvas: HTMLCanvasElement, filename = "result.png") => {
  canvas.toBlob((blob) => {
    if (!blob) return

    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")

    link.href = url
    link.download = filename
    link.click()

    URL.revokeObjectURL(url)
  }, "image/png")
}