import * as rx from "rxjs"

export const gridTypeSubject$ = new rx.BehaviorSubject<"lines" | "dots">("lines")
