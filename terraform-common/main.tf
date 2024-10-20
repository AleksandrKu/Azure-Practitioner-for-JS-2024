terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=3.0.0"
    }
  }

  required_version = ">= 1.1.0"
}

provider "azurerm" {
  features {}
}

module "resource_group" {
  source   = "./modules/resource_group"
  name     = "rg-common-sand-ne-001"
  location = "northeurope"
}

module "app_configuration" {
  source              = "./modules/app_configuration"
  name                = "appconfig-products-service-sand-ne-001"
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
}

module "api_management" {
  source              = "./modules/api_management"
  name                = "apim-common-sand-ne-001"
  location            = module.resource_group.location
  resource_group_name = module.resource_group.name
  publisher_name      = "Oleksandr Kunup"
  publisher_email     = "oleksandr_kunup@epam.com"
}

module "api_operations" {
  source              = "./modules/api_operations"
  resource_group_name = module.resource_group.name
  api_management_name = module.api_management.name
  backend_url         = "https://fa-products-service-dev-ne-001.azurewebsites.net/api"
}

module "cosmos_db" {
  source              = "./modules/cosmos_db"
  db_account_name     = "cosmosdb-products-service-sand-ne-001"
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
}

output "app_config_endpoint" {
  value = module.app_configuration.endpoint
}
