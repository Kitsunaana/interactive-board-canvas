type Rectangle = {
  type: "rectangle"
  width: number
  height: number
}

type Circle = {
  type: "circle"
  radius: number
}

type Node = Circle | Rectangle

declare const node: Node

function match() {
  
}