resource "azurerm_storage_account" "import_service" {
  name                     = var.storage_account_name
  location                 = var.location

  account_tier             = "Standard"
  account_replication_type = "LRS"
  access_tier              = "Cool"
  min_tls_version          = "TLS1_2"
  # enable_https_traffic_only = true
  allow_nested_items_to_be_public = false
  shared_access_key_enabled = true
  public_network_access_enabled = true

  resource_group_name      = var.resource_group_name
}

resource "azurerm_storage_container" "products_container_uploaded" {
  name                  = "products-container-uploaded"
  storage_account_name  = azurerm_storage_account.import_service.name
  container_access_type = "private"
}

resource "azurerm_storage_blob" "products_blob" {
  name                   = "products-service-blob"
  storage_account_name   = azurerm_storage_account.import_service.name
  storage_container_name = azurerm_storage_container.products_container_uploaded.name
  type                   = "Block"
  access_tier            = "Cool"
}

resource "azurerm_storage_container" "products_container_parsed" {
  name                  = "products-container-parsed"
  storage_account_name  = azurerm_storage_account.import_service.name
  container_access_type = "private"
}

resource "azurerm_storage_blob" "products_blob_parsed" {
  name                   = "products-service-blob-parsed"
  storage_account_name   = azurerm_storage_account.import_service.name
  storage_container_name = azurerm_storage_container.products_container_parsed.name
  type                   = "Block"
  access_tier            = "Cool"
}