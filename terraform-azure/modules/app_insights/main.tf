resource "azurerm_application_insights" "products_service_fa" {
  name                = var.appinsight_name
  location            = var.location
  resource_group_name = var.resource_group_name
  application_type    = var.appinsight_type
}