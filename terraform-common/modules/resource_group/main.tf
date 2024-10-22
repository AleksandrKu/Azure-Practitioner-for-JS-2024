resource "azurerm_resource_group" "common_rg" {
  name     = var.name
  location = var.location
}

output "name" {
  value = azurerm_resource_group.common_rg.name
}

output "location" {
  value = azurerm_resource_group.common_rg.location
}
