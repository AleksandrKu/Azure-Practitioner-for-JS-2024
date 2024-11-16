resource "azurerm_windows_function_app" "import_service" {
  name                       = var.name
  location                   = var.location

  service_plan_id            = var.service_plan_id
  resource_group_name        = var.resource_group_name

  storage_account_name       = var.storage_account_name
  storage_account_access_key = var.storage_account_access_key

  functions_extension_version = "~4"
  builtin_logging_enabled     = false

  site_config {
    always_on = false

    application_insights_key               = var.application_insights_key
    application_insights_connection_string = var.application_insights_connection_string

    application_stack {
      node_version = "~18"
    }
  }

  app_settings = {
    APPINSIGHTS_INSTRUMENTATIONKEY           = var.application_insights_key
    APPLICATIONINSIGHTS_CONNECTION_STRING    = var.application_insights_connection_string
    AzureWebJobsStorage                      = var.storage_account_connection_string
    STORAGE_ACCOUNT_NAME                     = var.storage_account_name
    STORAGE_ACCOUNT_KEY                      = var.storage_account_access_key
    AZURE_APP_CONFIG_CONNECTION_STRING       = var.app_config_connection_string
    WEBSITE_CONTENTAZUREFILECONNECTIONSTRING = var.storage_account_connection_string
    WEBSITE_CONTENTSHARE                     = var.storage_share_name
  }

  lifecycle {
    ignore_changes = [
      # app_settings
    ]
  }
}

# Add this at the end of the file
data "azurerm_function_app_host_keys" "import_service_function-app-host-keys" {
  name                = azurerm_windows_function_app.import_service.name
  resource_group_name = var.resource_group_name

  depends_on = [azurerm_windows_function_app.import_service]
}
