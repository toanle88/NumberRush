terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.1.0"
    }
  }

  # This tells Terraform to store its memory (state) in Azure
  backend "azurerm" {
    # Supply the environment-specific coordinates with -backend-config.
    use_oidc = true # Enables passwordless login for GitHub
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
  use_oidc = true
}
