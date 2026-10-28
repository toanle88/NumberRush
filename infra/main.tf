# 1. Create the Resource Group
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.resource_group_location
  tags = {
    environment = var.tag_environment
  }
}

# 2. Create the Static Web App
resource "azurerm_static_web_app" "numberrush" {
  name                = "numberrush-static-sites"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku_size            = "Free"
  sku_tier            = "Free"
}

# The provider keeps the deployment API key in Terraform state because it is
# an attribute of the Static Web App resource. Do not output or commit it;
# protect the remote state backend with access controls and encryption.
