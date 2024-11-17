/* Docs: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/servicebus_namespace.html */
resource "azurerm_servicebus_namespace" "sb_namespace" {
  name                          = "products-servicebus"
  location                      = var.location
  resource_group_name           = var.resource_group_name
  sku                           = "Standard" /* For Topics */
  capacity                      = 0 /* standard for sku plan */

  tags = {
    source = "terraform"
  }
}

/* Docs: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/servicebus_queue */
resource "azurerm_servicebus_queue" "queue" {
  name                                    = var.name
  namespace_id                            = azurerm_servicebus_namespace.sb_namespace.id
  status                                  = "Active" /* Default value */

  lock_duration                           = "PT1M" /* ISO 8601 timespan duration,1 Minute. 5 min is max */
  max_size_in_megabytes                   = 1024 /* Default value */
  max_delivery_count                      = 10 /* Default value */
  requires_duplicate_detection            = false
  duplicate_detection_history_time_window = "PT10M" /* ISO 8601 timespan duration */
  requires_session                        = false
  dead_lettering_on_message_expiration    = false
}

/* Docs: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/servicebus_topic */
resource "azurerm_servicebus_topic" "topic" {
  name                = "products-topic"
  namespace_id       = azurerm_servicebus_namespace.sb_namespace.id
}

/* Docs: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/servicebus_subscription */
resource "azurerm_servicebus_subscription" "subscription-1" {
  name                = "subscription-1"
  topic_id           = azurerm_servicebus_topic.topic.id
  max_delivery_count = 1
}

resource "azurerm_servicebus_subscription_rule" "subscription-1-rule-1" {
  name                = "subscription-1-rule-1"
  subscription_id     = azurerm_servicebus_subscription.subscription-1.id
  filter_type         = "SqlFilter"
  sql_filter          = "price > 500"
}

/* Docs: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/servicebus_subscription */
resource "azurerm_servicebus_subscription" "subscription-2" {
  name                = "subscription-2"
  topic_id           = azurerm_servicebus_topic.topic.id
  max_delivery_count = 1
}

resource "azurerm_servicebus_subscription_rule" "subscription-2-rule-1" {
  name                = "subscription-2-rule-1"
  subscription_id     = azurerm_servicebus_subscription.subscription-2.id
  filter_type         = "SqlFilter"
  sql_filter          = "price <= 500"
}
