declare module "swagger-ui-react" {
  import type { ComponentType } from "react"

  export interface SwaggerUIProps {
    url?: string
    spec?: object
    docExpansion?: "none" | "list" | "full"
    defaultModelsExpandDepth?: number
    tryItOutEnabled?: boolean
    supportedSubmitMethods?: string[]
    [key: string]: unknown
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>
  export default SwaggerUI
}

declare module "swagger-ui-react/swagger-ui.css"
