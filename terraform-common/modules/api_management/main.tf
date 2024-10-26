resource "azurerm_api_management" "common_api_management" {
  name                = var.name
  location            = var.location
  resource_group_name = var.resource_group_name
  publisher_name      = var.publisher_name
  publisher_email     = var.publisher_email

  sku_name = "Consumption_0"
}

output "name" {
  value = azurerm_api_management.common_api_management.name
}
