import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { registerSW } from "virtual:pwa-register"
import { Provider } from "./components/ui/provider"
import { Root } from "./Root"
import "./styles.css"

registerSW({ immediate: true })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider>
      <Root />
    </Provider>
  </StrictMode>,
)
