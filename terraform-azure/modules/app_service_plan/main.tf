resource "azurerm_service_plan" "app_service_plan" {
  name                = "asp-products-service-${var.env_prefix}-${var.region_prefix}-${var.denominator}"
  location            = var.location
  resource_group_name = var.resource_group_name
  os_type             = "Windows"
  sku_name            = "Y1" # This is for Consumption plan, change if needed

  tags = {
    environment = var.env_prefix
  }
}
