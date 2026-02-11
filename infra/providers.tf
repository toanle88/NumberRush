terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.1.0"
    }
  }

  # This tells Terraform to store its memory (state) in Azure
  backend "azurerm" {
    resource_group_name  = "shared-rg"
    storage_account_name = "toanle88sharedsa" # Put your unique name here
    container_name       = "numberrush-tfstate"
    key                  = "numberrush.terraform.numberrush-tfstate"
    use_oidc             = true # Enables passwordless login for GitHub
  }
}

provider "azurerm" {
  features {}
  use_oidc = true
}