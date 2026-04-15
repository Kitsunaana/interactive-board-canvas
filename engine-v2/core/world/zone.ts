import z from "zod"
import { Shader } from "../gl/shader"
import { Scene } from "./scene"
import { SimObject } from "./sim-object"

export enum ZoneState {
  UNINITIALIZED,
  LOADING,
  UPDATING
}

export class Zone {
  private _scene: Scene
  private _state: ZoneState = ZoneState.UNINITIALIZED
  private _globalId: number = -1

  public constructor(
    private readonly _id: number,
    private readonly _name: string,
    private readonly _description: string,
  ) {
    this._scene = new Scene()
  }

  public get id(): number {
    return this._id
  }

  public get name(): string {
    return this._name
  }

  public get description(): string {
    return this._description
  }

  public get scene(): Scene {
    return this._scene
  }

  public initialize(zoneData: any): void {
    const schema = z.object({
      objects: z.array(z.object())
    })

    const { success, data } = schema.safeParse(zoneData)
    
    if (success) {
      data.objects.forEach((object) => {
        this._scene.addObject(this._loadSimObject(object, null))
      })
    }
  }

  public load(): void {
    this._state = ZoneState.LOADING

    this._scene.load()

    this._state = ZoneState.UPDATING
  }

  public unload(): void {

  }

  public update(time: number): void {
    if (this._state === ZoneState.UPDATING) {
      this._scene.update(time)
    }
  }

  public render(shader: Shader): void {
    if (this._state === ZoneState.UPDATING) {
      this._scene.render(shader)
    }
  }

  public onActivated(): void {

  }

  public onDeactivated(): void {

  }

  private _loadSimObject(dataSection: any, parent: SimObject | null): SimObject {
    const name: string = dataSection.name

    this._globalId++

    const simObject = new SimObject(this._globalId, name, this._scene)

    if (Array.isArray(dataSection.children)) {
      dataSection.children.forEach((object: any) => {
        const child = this._loadSimObject(object, simObject)
        simObject.addChild(child)
      })
    }

    return simObject
  }
}