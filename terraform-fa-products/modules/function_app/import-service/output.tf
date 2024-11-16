output "output_fapp_name" {
  value = azurerm_windows_function_app.import_service.name
}

output "output_fapp_import_service_id" {
  value = azurerm_windows_function_app.import_service.id
}

output "output_fapp_default_key" {
  value     = data.azurerm_function_app_host_keys.import_service_function-app-host-keys.default_function_key
  sensitive = true
}

output "name" {
  value = azurerm_windows_function_app.import_service.name
}

output "id" {
  value = azurerm_windows_function_app.import_service.id
}

output "function_app_default_hostname" {
  value = azurerm_windows_function_app.import_service.default_hostname
}
