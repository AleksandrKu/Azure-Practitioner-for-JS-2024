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

resource "azurerm_cosmosdb_sql_role_definition" "products_app_role" {
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmosdb_account.name
  name                = "ProductsReadMetadataRole"
  type                = "CustomRole"
  assignable_scopes   = [azurerm_cosmosdb_account.cosmosdb_account.id]

  permissions {
    data_actions = [
      "Microsoft.DocumentDB/databaseAccounts/readMetadata",
      "Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/*",
      "Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/*"
    ]
  }
}

# Role assignment for the Managed Identity of your Function App
resource "azurerm_cosmosdb_sql_role_assignment" "fa_products_staging_read_metadata" {
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmosdb_account.name
  role_definition_id  = azurerm_cosmosdb_sql_role_definition.products_app_role.id
  principal_id        = "d5421087-31fd-4a21-b260-04ab933b6e56"
  scope               = azurerm_cosmosdb_account.cosmosdb_account.id

  depends_on = [azurerm_cosmosdb_sql_role_definition.products_app_role]
}

# Role assignment for the Managed Identity of your Function App
resource "azurerm_cosmosdb_sql_role_assignment" "fa_products_read_metadata" {
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmosdb_account.name
  role_definition_id  = azurerm_cosmosdb_sql_role_definition.products_app_role.id
  principal_id        = "3798d888-e842-4b05-9995-9c33dbc57a0b"
  scope               = azurerm_cosmosdb_account.cosmosdb_account.id

  depends_on = [azurerm_cosmosdb_sql_role_definition.products_app_role]
}

resource "azurerm_cosmosdb_sql_database" "products_app" {
  name                = "products-db"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmosdb_account.name
}

resource "azurerm_cosmosdb_sql_container" "products" {
  name                  = "products"
  resource_group_name   = var.resource_group_name
  account_name          = azurerm_cosmosdb_account.cosmosdb_account.name
  database_name         = azurerm_cosmosdb_sql_database.products_app.name
  partition_key_path    = "/id"
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

resource "azurerm_cosmosdb_sql_container" "stocks" {
  name                  = "stocks"
  resource_group_name   = var.resource_group_name
  account_name          = azurerm_cosmosdb_account.cosmosdb_account.name
  database_name         = azurerm_cosmosdb_sql_database.products_app.name
  partition_key_path    = "/product_id"
  partition_key_version = 1

  default_ttl = -1

  indexing_policy {
    excluded_path {
      path = "/*"
    }
  }
}
