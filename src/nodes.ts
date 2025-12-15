import { BehaviorSubject } from "rxjs";

export type Node = {
    x: number
    y: number
    id: string
    width: number
    height: number
}

const nodes: Node[] = [
    {
        id: "1",
        x: -200,
        y: -200,
        width: 100,
        height: 70,
    },
    {
        id: "1",
        x: -150,
        y: -150,
        width: 100,
        height: 70,
    },
    {
        id: "2",
        x: 200,
        y: 200,
        width: 100,
        height: 70,
    },
    {
        id: "2",
        x: 320,
        y: 2000,
        width: 100,
        height: 70,
    }
]

export const nodes$ = new BehaviorSubject(nodes)
