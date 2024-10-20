resource "azurerm_app_configuration" "products_config" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = "free"
}

output "endpoint" {
  value = azurerm_app_configuration.products_config.endpoint
}
