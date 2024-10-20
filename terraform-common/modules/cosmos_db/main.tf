resource "azurerm_cosmosdb_account" "cosmosdb_account" {
  name                = var.db_account_name
  resource_group_name = var.resource_group_name
  location            = var.location
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level = "Eventual"
  }

  capabilities {
    name = "EnableServerless"
  }

  geo_location {
    failover_priority = 0
    location          = var.location
  }
}

resource "azurerm_cosmosdb_sql_database" "products_app" {
  name                = "products-db"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmosdb_account.name
}

resource "azurerm_cosmosdb_sql_container" "products" {
  name                = "products"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmosdb_account.name
  database_name       = azurerm_cosmosdb_sql_database.products_app.name
  partition_key_path  = "/id"
  partition_key_version = 1

  # Cosmos DB supports TTL for the records
  default_ttl = -1

  # This indexing policy excludes all paths from indexing
  # It can significantly reduce the cost of write operations
  # but may impact query performance for non-id based queries
  indexing_policy {
    excluded_path {
      path = "/*"
    }
  }
}
