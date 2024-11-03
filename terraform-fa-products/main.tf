# Resource Group
module "product_service_rg" {
  source   = "./modules/resourcegroup"
  name     = "rg-product-service-${var.env_prefix}-${var.region_prefix}-${var.denominator}"
  location = var.location
}

# App Service Plan
module "app_service_plan" {
  source              = "./modules/app_service_plan"
  resource_group_name = module.product_service_rg.name
  location            = var.location
  env_prefix          = var.env_prefix
  region_prefix       = var.region_prefix
  denominator         = var.denominator
}

# Application Insights
module "app_insights" {
  source              = "./modules/app_insights"
  appinsight_name     = "appins-fa-products-service-${var.env_prefix}-${var.region_prefix}-${var.denominator}"
  resource_group_name = module.product_service_rg.name
  location            = var.location
  appinsight_type     = "web"
}

# Storage Account
module "storage_account" {
  source              = "./modules/storage_account"
  name                = "stgacctfa${var.env_prefix}${var.region_prefix}${var.denominator}"
  resource_group_name = module.product_service_rg.name
  location            = var.location
}

# Function App
module "function_app" {
  source                                 = "./modules/function_app/function-api"
  name                                   = "fa-products-service-${var.env_prefix}-${var.region_prefix}-${var.denominator}"
  resource_group_name                    = module.product_service_rg.name
  location                               = var.location
  service_plan_id                        = module.app_service_plan.asp_id
  storage_account_name                   = module.storage_account.name
  storage_account_access_key             = module.storage_account.primary_access_key
  application_insights_key               = module.app_insights.instrumentation_key
  application_insights_connection_string = module.app_insights.connection_string
  env_prefix                             = var.env_prefix
  region_prefix                          = var.region_prefix
  denominator                            = var.denominator
  storage_account_connection_string      = module.storage_account.primary_connection_string
  storage_share_name                     = "staging"
  app_config_connection_string           = var.app_config_connection_string
}

# Deployment Slot
resource "azurerm_windows_function_app_slot" "staging" {
  name                       = "staging"
  function_app_id            = module.function_app.id
  storage_account_name       = module.storage_account.name
  storage_account_access_key = module.storage_account.primary_access_key

  site_config {
    application_insights_key               = module.app_insights.instrumentation_key
    application_insights_connection_string = module.app_insights.connection_string
    application_stack {
      node_version = "~18"
    }
    # use_32_bit_worker        = false
    # always_on                = true
    # ftps_state               = "Disabled"
    # http2_enabled            = true
    # websockets_enabled       = false
    # remote_debugging_enabled = false
    # remote_debugging_version = "VS2019"
    
    # # Disable "Subscription required"
    cors {
      allowed_origins     = ["*"]
      support_credentials = false
    }
  }

  app_settings = {
    WEBSITE_CONTENTAZUREFILECONNECTIONSTRING = module.storage_account.primary_connection_string
    WEBSITE_CONTENTSHARE                     = lower("staging-${module.function_app.name}")
    FUNCTIONS_WORKER_RUNTIME                 = "node"
    WEBSITE_NODE_DEFAULT_VERSION             = "~18"
    WEBSITE_RUN_FROM_PACKAGE                 = "1"
    AZURE_APP_CONFIG_CONNECTION_STRING       = var.app_config_connection_string
  }
  lifecycle {
    ignore_changes = [
      app_settings,
      tags,
      identity,
      site_config["application_stack"],
      tags["hidden-link: /app-insights-instrumentation-key"],
      tags["hidden-link: /app-insights-resource-id"],
      tags["hidden-link: /app-insights-conn-string"]
    ]
  }
}

# Function App for Import Service
module "function_app_import" {
  source                                 = "./modules/function_app/import-service"
  name                                   = "fa-import-service-${var.env_prefix}-${var.region_prefix}-${var.denominator}"
  resource_group_name                    = module.product_service_rg.name
  location                               = var.location
  service_plan_id                        = module.app_service_plan.asp_id
  storage_account_name                   = module.storage_account_import.storage_account_name
  storage_account_access_key             = module.storage_account_import.primary_access_key
  application_insights_key               = module.app_insights.instrumentation_key
  application_insights_connection_string = module.app_insights.connection_string
  storage_account_connection_string      = module.storage_account_import.primary_connection_string
  storage_share_name                     = "import-service-staging"
  app_config_connection_string           = var.app_config_connection_string
}

# Storage Account for Import Service
module "storage_account_import" {
  source               = "./modules/storage_account_blob"
  storage_account_name = "stgimport${var.env_prefix}${var.region_prefix}${var.denominator}"
  env_prefix           = var.env_prefix
  location             = var.location
  resource_group_name  = module.product_service_rg.name
}

