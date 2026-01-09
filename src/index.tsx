import { createRoot } from "react-dom/client"
import { App } from "./app/app"
import "./shared/lib/seed"

const root = createRoot(document.getElementById("app") as HTMLElement)

root.render(<App />)