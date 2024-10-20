terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=3.0.0"
    }
  }

  required_version = ">= 1.1.0"
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "common_rg" {
  name     = "rg-common-sand-ne-001"
  location = "northeurope"
}

resource "azurerm_app_configuration" "products_config" {
  name                = "appconfig-products-service-sand-ne-001"
  resource_group_name = azurerm_resource_group.common_rg.name
  location            = azurerm_resource_group.common_rg.location
  sku                 = "free"
}


resource "azurerm_api_management" "common_api_management" {
  name                = "apim-common-sand-ne-001"
  location            = azurerm_resource_group.common_rg.location
  resource_group_name = azurerm_resource_group.common_rg.name
  publisher_name      = "Oleksandr Kunup" 
  publisher_email     = "oleksandr_kunup@epam.com"

  sku_name = "Consumption_0"
}

output "app_config_endpoint" {
  value = azurerm_app_configuration.products_config.endpoint
}

resource "azurerm_api_management_api" "products_api" {
  name                = "products-service-api"
  resource_group_name = azurerm_resource_group.common_rg.name
  api_management_name = azurerm_api_management.common_api_management.name
  revision            = "1"
  display_name        = "Products Service API"
  protocols           = ["https"]
}

data "azurerm_function_app_host_keys" "products_keys" {
  name                = "fa-products-service-dev-ne-001"
  resource_group_name = "rg-product-service-dev-ne-001"
}

resource "azurerm_api_management_backend" "products_fa" {
  name                = "products-service-backend"
  resource_group_name = azurerm_resource_group.common_rg.name
  api_management_name = azurerm_api_management.common_api_management.name
  protocol            = "http"
  url                 = "https://fa-products-service-dev-ne-001.azurewebsites.net/api"
  description         = "Products API"

  # credentials {
  #   certificate = []
  #   query       = {}

  #   header = {
  #     "x-functions-key" = data.azurerm_function_app_host_keys.products_keys.default_function_key
  #   }
  # }
}

resource "azurerm_api_management_api_policy" "api_policy" {
  api_name            = azurerm_api_management_api.products_api.name
  api_management_name = azurerm_api_management.common_api_management.name
  resource_group_name = azurerm_resource_group.common_rg.name

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
  api_management_name = azurerm_api_management.common_api_management.name
  api_name            = azurerm_api_management_api.products_api.name
  display_name        = "Get Products"
  method              = "GET"
  operation_id        = "get-products"
  resource_group_name = azurerm_resource_group.common_rg.name
  url_template        = "/product/available"
}