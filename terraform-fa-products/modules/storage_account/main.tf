resource "azurerm_storage_account" "products_service_fa" {
  name     = var.name
  location = var.location

  account_replication_type = "LRS"
  account_tier             = "Standard"
  account_kind             = "StorageV2"

  resource_group_name = var.resource_group_name
}

resource "azurerm_storage_share" "products_service_share_fa" {
  name  = "fa-products-service-share"
  quota = 2

  storage_account_name = azurerm_storage_account.products_service_fa.name
}