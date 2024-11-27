variable "unique_resource_id_prefix" {
  type        = string
  description = "Prefix for resource names"
}

variable "location" {
  type        = string
  description = "Azure region location"
}

variable "resource_group_name" {
  type        = string
  description = "Name of the resource group"
}

variable "chatbot_container_name" {
  type        = string
  description = "Name of the container image"
}

variable "chatbot_container_tag_acr" {
  type        = string
  description = "Tag of the container image"
  default     = "latest"
}

variable "environment" {
  type        = string
  description = "Environment name (e.g. dev, prod)"
  default     = "dev"
}
