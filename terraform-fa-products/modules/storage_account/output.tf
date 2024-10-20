output "storage_account_id" {
  value       = azurerm_storage_account.products_service_fa.id
}

output "primary_blob_endpoint" {
  value       = azurerm_storage_account.products_service_fa.primary_blob_endpoint
}

output "primary_connection_string" {
  value       = azurerm_storage_account.products_service_fa.primary_connection_string
}

output "primary_access_key" {
  value       = azurerm_storage_account.products_service_fa.primary_access_key
}

output "name" {
  value       = azurerm_storage_account.products_service_fa.name
}