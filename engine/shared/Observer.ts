export interface Observable {
  update(): void
}

export class Observer {
  private _observers: Array<Observable> = []

  public attach(observer: Observable) {
    const isExist = this._observers.includes(observer)
    if (isExist) return

    this._observers.push(observer)
  }

  public detach(observer: Observable) {
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