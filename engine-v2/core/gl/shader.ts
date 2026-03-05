import { isNil } from "lodash"
import { GLRenderer } from "./gl"

export class Shader {
  private _program!: WebGLProgram
  private _attributes: Record<string, number> = {}
  private _uniforms: Record<string, WebGLUniformLocation> = {}

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

    this.detectAttributes()
    this.detectUniforms()
  }

  public use(): void {
    this._renderer.gl.useProgram(this._program)
  }

  public getAttributeLocation(name: string): number {
    const location = this._attributes[name]

    if (location === undefined) 
      throw new Error(`Unable to find attribute named '${name}'`)
    
    return location
  }

  public getUniformLocation(name: string): WebGLUniformLocation {
    const location = this._uniforms[name] 
    
    if (location === undefined)
      throw new Error(`Unable to find uniform named '${name}'`)

    return location
  }

  private loadShader(source: string, shaderType: number): WebGLShader {
    const gl = this._renderer.gl

    const shader = gl.createShader(shaderType)

    if (shader === null) throw new Error("Failed to create shader")

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader)

      throw new Error(`Error compiling shader '${this._name}': ${info}`)
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

      throw new Error(`Error linking shader '${this._name}': ${info}`)
    }
  }

  private detectAttributes(): void {
    const gl = this._renderer.gl

    const attributeCount = gl.getProgramParameter(this._program, gl.ACTIVE_ATTRIBUTES)

    for (let i = 0; i < attributeCount; i++) {
      const info = gl.getActiveAttrib(this._program, i)
      if (isNil(info)) continue

      this._attributes[info.name] = gl.getAttribLocation(this._program, info.name)
    }
  }

  private detectUniforms(): void {
    const gl = this._renderer.gl

    const uniformCount = gl.getProgramParameter(this._program, gl.ACTIVE_UNIFORMS)

    for (let i = 0; i < uniformCount; i++) {
      const info = gl.getActiveUniform(this._program, i)
      if (isNil(info)) continue

      const location = gl.getUniformLocation(this._program, info.name)
      if (isNil(location)) continue

      this._uniforms[info.name] = location
    }
  }
}