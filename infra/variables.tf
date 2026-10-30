variable "subscription_id" {
  description = "Azure subscription ID supplied by the protected deployment environment."
  type        = string
  sensitive   = true
}

variable "resource_group_name" {
  type    = string
  default = "numberrush-rg"
}

variable "resource_group_location" {
  type    = string
  default = "East Asia"
}

variable "tag_environment" {
  type    = string
  default = "pro"
}
