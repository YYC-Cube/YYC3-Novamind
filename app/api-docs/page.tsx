/**
 * OpenAPI 文档页面 - Swagger UI
 *
 * 数据源：pnpm openapi:generate 产出 public/docs/openapi.generated.yaml
 */
"use client"

import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"

export default function ApiDocsPage() {
  return (
    <section>
      <SwaggerUI url="/docs/openapi.generated.yaml" />
    </section>
  )
}
