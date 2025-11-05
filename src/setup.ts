const canvas = document.createElement("canvas")

canvas.width = window.innerWidth
canvas.height = window.innerHeight
canvas.style.backgroundColor = "#f2f2f2"

canvas.oncontextmenu = (event) => {
  event.preventDefault()
}

document.body.appendChild(canvas)

const context = canvas.getContext("2d")

if (context === null) throw new Error("Failed to get context")

export {
  context,
  canvas,
}