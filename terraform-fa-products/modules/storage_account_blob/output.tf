output "name" {
  value       = azurerm_storage_account.import_service.name
}

output "storage_account_name" {
  value = azurerm_storage_account.import_service.name
}

output "primary_access_key" {
  value     = azurerm_storage_account.import_service.primary_access_key
  sensitive = true
}

output "primary_connection_string" {
  value     = azurerm_storage_account.import_service.primary_connection_string
  sensitive = true
}
