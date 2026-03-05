export const vertexShaderSource = /*glsl*/`#version 300 es

  in vec3 a_position;

  uniform mat4 u_projection;
  uniform mat4 u_model;

  void main() {
    gl_Position = u_projection * u_model * vec4(a_position, 1.0);
  }

`

export const fragmentShaderSource = /*glsl*/`#version 300 es
  precision mediump float;

  out vec4 outColor;

  uniform vec4 u_color;

  void main() {
    outColor = u_color;
  }
`