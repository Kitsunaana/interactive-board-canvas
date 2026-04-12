import { SpriteComponent } from "../components/sprite-component";
import { SimObject } from "./sim-object";
import { Zone } from "./zone";

export class TestZone extends Zone {
  private _parentObject!: SimObject

  private _testObject!: SimObject
  private _testSprite!: SpriteComponent

  public load(): void {
    this._parentObject = new SimObject(0, "parentObject")
    this._parentObject.transform.position.x = 100
    this._parentObject.transform.position.y = 100

    this._testObject = new SimObject(1, "testObject")
    this._testSprite = new SpriteComponent("test", "crate")
    this._testObject.addComponent(this._testSprite)

    this._testObject.transform.position.x = 100
    this._testObject.transform.position.y = 100

    this._parentObject.addChild(this._testObject)

    this.scene.addObject(this._parentObject)

    super.load()
  }

  public update(time: number) {
    this._testObject.transform.rotation.z += 0.01

    super.update(time)
  }
}