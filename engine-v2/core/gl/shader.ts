import { GLRenderer } from "./gl"

export class Shader {
  private _program!: WebGLProgram

  public get name() {
    return this._name
  }

  public constructor(
    private readonly _renderer: GLRenderer, private readonly _name: string,
    vertexSource: string, fragmentSource: string
  ) {
    const vertexShader = this.loadShader(vertexSource, _renderer.gl.VERTEX_SHADER)
    const fragmentShader = this.loadShader(fragmentSource, _renderer.gl.FRAGMENT_SHADER)

    this.createProgram(vertexShader, fragmentShader)
  }

  public use(): void {
    this._renderer.gl.useProgram(this._program)
  }

  private loadShader(source: string, shaderType: number): WebGLShader {
    const gl = this._renderer.gl

    const shader = gl.createShader(shaderType)

    if (shader === null) throw new Error("Failed to create shader")

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader)
      
      throw new Error(`Error compiling shader ${this._name}: ${info}`)
    }
    
    return shader
  }

  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): void {
    const gl = this._renderer.gl

    this._program = gl.createProgram()

    gl.attachShader(this._program, vertexShader)
    gl.attachShader(this._program, fragmentShader)

    gl.linkProgram(this._program)

    if (!gl.getProgramParameter(this._program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(this._program)

      throw new Error(`Error linking shader ${this._name}: ${info}`)
    }
  }
}