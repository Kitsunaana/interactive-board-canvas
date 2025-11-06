import { Observable } from "rxjs"

const observable = new Observable(subsriber => {
  subsriber.next(2)
})

observable.subscribe(value => {
  console.log(value)
})