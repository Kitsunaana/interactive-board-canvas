import { BaseComponent } from "./base-component";
import { Sprite } from "../graphics/sprite"
import { Shader } from "../gl/shader";

export class SpriteComponent extends BaseComponent {
  private _sprite: Sprite

  public constructor(name: string, materialName: string) {
    super(name)

    this._sprite = new Sprite(name, materialName)
  }

  public load(): void {
    this._sprite.load()
  }

  public render(shader: Shader) {
    this._sprite.draw(shader, this.owner.worldMatrix)
    super.render(shader)
  }
}