resource "azurerm_api_management_api" "products_api" {
  name                = "products-service-api"
  resource_group_name = var.resource_group_name
  api_management_name = var.api_management_name
  revision            = "1"
  display_name        = "Products Service API"
  protocols           = ["https"]
  subscription_required = false
}

resource "azurerm_api_management_backend" "products_fa" {
  name                = "products-service-backend"
  resource_group_name = var.resource_group_name
  api_management_name = var.api_management_name
  protocol            = "http"
  url                 = var.backend_url
  description         = "Products API"
}

resource "azurerm_api_management_api_policy" "api_policy" {
  api_name            = azurerm_api_management_api.products_api.name
  api_management_name = var.api_management_name
  resource_group_name = var.resource_group_name

  xml_content = <<XML
<policies>
  <inbound>
      <cors>
      <allowed-origins>
        <origin>*</origin>
      </allowed-origins>
      <allowed-methods>
        <method>GET</method>
        <method>OPTIONS</method>
      </allowed-methods>
      <allowed-headers>
        <header>*</header>
      </allowed-headers>
    </cors>
    <set-backend-service backend-id="${azurerm_api_management_backend.products_fa.name}" />
    <base />
  </inbound>
  <backend>
    <base />
  </backend>
  <outbound>
    <base />
  </outbound>
  <on-error>
    <base />
  </on-error>
</policies>
XML
}

resource "azurerm_api_management_api_operation" "get_products" {
  api_management_name = var.api_management_name
  api_name            = azurerm_api_management_api.products_api.name
  display_name        = "Get Products"
  method              = "GET"
  operation_id        = "get-products"
  resource_group_name = var.resource_group_name
  url_template        = "/product/available"
}
