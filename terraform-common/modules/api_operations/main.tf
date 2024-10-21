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
resource "azurerm_api_management_api_operation" "get_admin_products" {
  api_management_name = var.api_management_name
  api_name            = azurerm_api_management_api.products_api.name
  display_name        = "Get Products"
  method              = "GET"
  operation_id        = "get-admin-products"
  resource_group_name = var.resource_group_name
  url_template        = "/admin/products"
}

resource "azurerm_api_management_api_operation" "get_products" {
  api_management_name = var.api_management_name
  api_name            = azurerm_api_management_api.products_api.name
  display_name        = "Get Products"
  method              = "GET"
  operation_id        = "get-products"
  resource_group_name = var.resource_group_name
  url_template        = "/products"
}

resource "azurerm_api_management_api_operation" "get_available_products" {
  api_management_name = var.api_management_name
  api_name            = azurerm_api_management_api.products_api.name
  display_name        = "Get Available Products"
  method              = "GET"
  operation_id        = "get-available-products"
  resource_group_name = var.resource_group_name
  url_template        = "/product/available"
}

resource "azurerm_api_management_api_operation" "get_product_by_id" {
  api_management_name = var.api_management_name
  api_name            = azurerm_api_management_api.products_api.name
  display_name        = "Get Product By Id"
  method              = "GET"
  operation_id        = "get-product-by-id"
  resource_group_name = var.resource_group_name
  url_template        = "/products/{productId}"
  description         = "Get a product by its ID"

  template_parameter {
    name     = "productId"
    required = true
    type     = "string"
  }

  response {
    status_code = 200
  }
}

resource "azurerm_api_management_api_operation" "create_product" {
  api_management_name = var.api_management_name
  api_name            = azurerm_api_management_api.products_api.name
  display_name        = "Create Product"
  method              = "POST"
  operation_id        = "create-product"
  resource_group_name = var.resource_group_name
  url_template        = "/product"
}

resource "azurerm_api_management_api_operation" "update_product" {
  api_management_name = var.api_management_name
  api_name            = azurerm_api_management_api.products_api.name
  display_name        = "Update Product"
  method              = "PUT"
  operation_id        = "update-product"
  resource_group_name = var.resource_group_name
  url_template        = "/products/{productId}"
  description         = "Update a product"

  template_parameter {
    name     = "productId"
    required = true
    type     = "string"
  }

  response {
    status_code = 200
  }
}

resource "azurerm_api_management_api_operation" "delete_product" {
  api_management_name = var.api_management_name
  api_name            = azurerm_api_management_api.products_api.name
  display_name        = "Delete Product"
  method              = "DELETE"
  operation_id        = "delete-product"
  resource_group_name = var.resource_group_name
  url_template        = "/products/{productId}"
  description         = "Delete a product"

  template_parameter {
    name     = "productId"
    required = true
    type     = "string"
  }

  response {
    status_code = 204
  }
}
