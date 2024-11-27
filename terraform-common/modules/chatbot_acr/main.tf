resource "azurerm_container_registry" "chatbot_acr" {
  name                = "${var.unique_resource_id_prefix}chatbotacr"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = "Basic"
  admin_enabled       = true
}

resource "azurerm_log_analytics_workspace" "chatbot_log_analytics_workspace" {
  name                = "${var.unique_resource_id_prefix}-log-analytics-chatbot"
  location            = var.location
  resource_group_name = var.resource_group_name
}

resource "azurerm_container_app_environment" "chatbot_cae" {
  name                       = "${var.unique_resource_id_prefix}-cae-chatbot"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.chatbot_log_analytics_workspace.id
}

resource "azurerm_container_app" "chatbot_ca_docker_acr" {
  name                         = "${var.unique_resource_id_prefix}-chatbot-ca-acr"
  container_app_environment_id = azurerm_container_app_environment.chatbot_cae.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"

  registry {
    server               = azurerm_container_registry.chatbot_acr.login_server
    username             = azurerm_container_registry.chatbot_acr.admin_username
    password_secret_name = "acr-password"
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 4000

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }

  }

  template {
    container {
      name   = "${var.unique_resource_id_prefix}-chatbot-container-acr"
      image  = "${azurerm_container_registry.chatbot_acr.login_server}/${var.chatbot_container_name}:${var.chatbot_container_tag_acr}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "CONTAINER_REGISTRY_NAME"
        value = "Azure Container Registry"
      }
    }
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.chatbot_acr.admin_password
  }
}

# resource "azurerm_container_app" "chatbot_ca_docker_hub" {
#   name                         = "${var.unique_resource_id_prefix}-chatbot-ca-dh"
#   container_app_environment_id = azurerm_container_app_environment.chatbot_cae.id
#   resource_group_name          = var.resource_group_name
#   revision_mode                = "Single"

#   registry {
#     server               = "docker.io"
#     username             = "alexdocker77"
#     password_secret_name = "docker-io-pass"
#   }

#   ingress {
#     allow_insecure_connections = false
#     external_enabled           = true
#     target_port                = 3000

#     traffic_weight {
#       percentage      = 100
#       latest_revision = true
#     }

#   }

#   template {
#     container {
#       name   = "${var.unique_resource_id_prefix}-chatbot-container-dh"
#       image  = "alexdocker77/${var.chatbot_container_name}:${var.chatbot_container_tag_dh}"
#       cpu    = 0.25
#       memory = "0.5Gi"

#       env {
#         name  = "CONTAINER_REGISTRY_NAME"
#         value = "Docker Hub"
#       }
#     }
#   }

#   secret {
#     name  = "docker-io-pass"
#     value = var.docker_hub_password
#   }
# }

# Create an App Service Plan
resource "azurerm_service_plan" "app_service_plan" {
  name                = "${var.unique_resource_id_prefix}-app-service-plan-chatbot"
  location            = var.location
  resource_group_name = var.resource_group_name
  os_type             = "Linux"
  sku_name            = "B1"
}



resource "azurerm_linux_web_app" "web_app" {
  name                = "${var.unique_resource_id_prefix}-web-app-chatbot"
  location            = var.location
  resource_group_name = var.resource_group_name
  service_plan_id     = azurerm_service_plan.app_service_plan.id

  site_config {
    application_stack {
      docker_image_name = "${var.chatbot_container_name}:${var.chatbot_container_tag_acr}"
      docker_registry_url = "https://${azurerm_container_registry.chatbot_acr.login_server}"
      docker_registry_username = azurerm_container_registry.chatbot_acr.admin_username
      docker_registry_password = azurerm_container_registry.chatbot_acr.admin_password
    }

    always_on                = true
    http2_enabled           = true
    minimum_tls_version     = "1.2"
    vnet_route_all_enabled  = true
    
    health_check_path       = "/health"
    health_check_eviction_time_in_min = 2
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "WEBSITES_PORT"                       = "4000"
    "DOCKER_ENABLE_CI"                    = "true"
    "DOCKER_REGISTRY_SERVER_URL"          = "https://${azurerm_container_registry.chatbot_acr.login_server}"
    "DOCKER_REGISTRY_SERVER_USERNAME"     = azurerm_container_registry.chatbot_acr.admin_username
    "DOCKER_REGISTRY_SERVER_PASSWORD"     = azurerm_container_registry.chatbot_acr.admin_password
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.app_insights.connection_string
  }

  identity {
    type = "SystemAssigned"
  }

  logs {
    detailed_error_messages = true
    failed_request_tracing = true
    
    application_logs {
      file_system_level = "Information"
    }

    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }

  lifecycle {
    ignore_changes = [
      tags
    ]
  }
}

# Application Insights for monitoring
resource "azurerm_application_insights" "app_insights" {
  name                = "${var.unique_resource_id_prefix}-appinsights"
  location            = var.location
  resource_group_name = var.resource_group_name
  application_type    = "web"
  sampling_percentage = 100
}

# Grant ACR pull access to the web app
resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.chatbot_acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_web_app.web_app.identity[0].principal_id
}
