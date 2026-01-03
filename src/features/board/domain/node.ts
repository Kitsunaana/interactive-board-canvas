import { BehaviorSubject } from "rxjs"
import {nodes} from "./_assets.ts";
import type {Sticker} from "./sticker.ts";

export type BaseNode = {
  id: string
  type: string
  colorId: string

  x: number
  y: number
}

export type Grid = {
  id: string
  type: "grid"
  colorId: string
}

export type Node = Sticker

export const nodes$ = new BehaviorSubject(nodes)