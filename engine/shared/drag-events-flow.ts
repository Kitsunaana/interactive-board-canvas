export type HandleCallback = (event: PointerEvent) => void

export abstract class EventsMoveFlow {
  public abstract start(event: PointerEvent): void
  public abstract process(event: PointerEvent): void
  public abstract commit(event: PointerEvent): void

  private _handleDownCallback: HandleCallback | null = null
  private _handleMoveCallback: HandleCallback | null = null
  private _handleUpCallback: HandleCallback | null = null

  public subscribe(): void {
    this._handleDownCallback = (event) => {
      this.start(event)

      window.addEventListener("pointermove", this._handleMoveCallback!)
      window.addEventListener("pointerup", this._handleUpCallback!)
    }

    this._handleMoveCallback = (event) => {
      this.process(event)
    }

    this._handleUpCallback = (event) => {
      this.commit(event)

      window.removeEventListener("pointermove", this._handleMoveCallback!)
      window.removeEventListener("pointerup", this._handleUpCallback!)
    }

    window.addEventListener("pointerdown", this._handleDownCallback)
  }

  public unsubscribe(): void {
    window.removeEventListener("pointerdown", this._handleDownCallback!)
    window.removeEventListener("pointermove", this._handleMoveCallback!)
    window.removeEventListener("pointerup", this._handleUpCallback!)
  }
}