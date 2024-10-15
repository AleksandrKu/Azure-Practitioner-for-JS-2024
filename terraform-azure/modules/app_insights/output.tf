output "connection_string" {
  value     = azurerm_application_insights.products_service_fa.connection_string
  sensitive = true
}

output "instrumentation_key" {
  value = azurerm_application_insights.products_service_fa.instrumentation_key
}

output "app_id" {
  value = azurerm_application_insights.products_service_fa.app_id
}