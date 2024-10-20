resource "azurerm_resource_group" "product_service_rg" {
  name     = var.name
  location = var.location
}