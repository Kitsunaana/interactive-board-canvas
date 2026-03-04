export const vertexShaderSource = /*glsl*/`#version 300 es

  in vec3 a_position;

  void main() {
    gl_Position = vec4(a_position, 1.0);
  }

`

export const fragmentShaderSource = /*glsl*/`#version 300 es
  precision mediump float;

  out vec4 outColor;

  void main() {
    outColor = vec4(1.0);
  }
`