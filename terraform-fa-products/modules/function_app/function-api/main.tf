resource "azurerm_windows_function_app" "products_service" {
  name     = var.name
  location = var.location

  service_plan_id     = var.service_plan_id
  resource_group_name = var.resource_group_name

  storage_account_name       = var.storage_account_name
  storage_account_access_key = var.storage_account_access_key

  functions_extension_version = "~4"
  builtin_logging_enabled     = false
  # sticky_settings {
  #   app_setting_names = ["AZURE_APP_CONFIG_CONNECTION_STRING"]
  # }

  site_config {
    always_on = false

    application_insights_key               = var.application_insights_key
    application_insights_connection_string = var.application_insights_connection_string

    # For production systems set this to false, but consumption plan supports only 32bit workers
    use_32_bit_worker = true

    # Enable function invocations from Azure Portal.
    cors {
      allowed_origins = ["https://portal.azure.com"]
    }

    application_stack {
      node_version = "~18"
    }
  }

  app_settings = {
    WEBSITE_CONTENTAZUREFILECONNECTIONSTRING = var.storage_account_connection_string
    WEBSITE_CONTENTSHARE                     = var.storage_share_name
    AZURE_APP_CONFIG_CONNECTION_STRING       = var.app_config_connection_string
  }

  # The app settings changes cause downtime on the Function App. e.g. with Azure Function App Slots
  # Therefore it is better to ignore those changes and manage app settings separately off the Terraform.
  lifecycle {
    ignore_changes = [
      app_settings,
      site_config["application_stack"], // workaround for a bug when azure just "kills" your app
      tags["hidden-link: /app-insights-instrumentation-key"],
      tags["hidden-link: /app-insights-resource-id"],
      tags["hidden-link: /app-insights-conn-string"]
    ]
  }
}

# Add this at the end of the file
data "azurerm_function_app_host_keys" "function-app-host-keys" {
  name                = azurerm_windows_function_app.products_service.name
  resource_group_name = var.resource_group_name

  depends_on = [azurerm_windows_function_app.products_service]
}
