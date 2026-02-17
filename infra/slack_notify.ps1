param (
    [Parameter(Mandatory=$true)]
    [string]$AgentName,
    [Parameter(Mandatory=$true)]
    [string]$Status,
    [Parameter(Mandatory=$true)]
    [string]$Report
)

$WebhookUrl = $env:SLACK_WEBHOOK_URL

if (-not $WebhookUrl) {
    Write-Error "Environment variable SLACK_WEBHOOK_URL is not set."
    exit 1
}

$Payload = @{
    blocks = @(
        @{
            type = "header"
            text = @{
                type = "plain_text"
                text = "Agent Report: $AgentName"
            }
        },
        @{
            type = "section"
            fields = @(
                @{
                    type = "mrkdwn"
                    text = "*Status:*`n$Status"
                }
            )
        },
        @{
            type = "section"
            text = @{
                type = "mrkdwn"
                text = "*Report:*`n$Report"
            }
        }
    )
}

$JsonPayload = $Payload | ConvertTo-Json -Depth 10 -Compress
$Utf8Payload = [System.Text.Encoding]::UTF8.GetBytes($JsonPayload)

Invoke-RestMethod -Uri $WebhookUrl -Method Post -Body $Utf8Payload -ContentType "application/json; charset=utf-8"
