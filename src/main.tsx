import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { registerSW } from "virtual:pwa-register"
import { Provider } from "./components/ui/provider"
import { App } from "./App"
import "./styles.css"

registerSW({ immediate: true })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider>
      <App />
    </Provider>
  </StrictMode>,
)
