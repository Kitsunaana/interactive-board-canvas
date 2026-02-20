export interface Observerable {
  update(): void
}

export class Observer {
  private _observers: Array<Observerable> = []

  public attach(observer: Observerable) {
    const isExist = this._observers.includes(observer)
    if (isExist) return

    this._observers.push(observer)
  }

  public detach(observer: Observerable) {
    const index = this._observers.indexOf(observer)
    if (index === -1) return

    this._observers.splice(index, 1)
  }

  public notify() {
    this._observers.forEach((observer) => {
      observer.update()
    })
  }
}