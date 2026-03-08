param(
    [string]$OutputPath = "C:\Users\jinruishao\MCS-Portal\data\support-insights.json"
)

$clusterUri = 'https://cxedataplatformcluster.westus2.kusto.windows.net/v2/rest/query'
$database = 'cxedata'

$summaryQuery = @"
getSEDICSupportRequestsTbl
| where Program == 'MCS'
| summarize
    totalMcsCases = count(),
    openMcsCases = countif(ServiceRequestState =~ 'Open'),
    openSevAB = countif(ServiceRequestState =~ 'Open' and tostring(ServiceRequestCurrentSeverity) in ('1','A','B')),
    icmLinked = countif(tobool(HasICM) == true or isnotempty(tostring(RelatedICM_Id))),
    critSitCases = countif(tostring(IsCritSit) =~ 'Yes' or tobool(IsCritSit) == true),
    irMetYes = countif(IsIRMet =~ 'Yes'),
    irMetNo = countif(IsIRMet =~ 'No'),
    avgCaseAgeDays = round(avg(todouble(CaseAge)), 1),
    reopenedCases = countif(tobool(isReopened) == true or toint(ReopenCount) > 0),
    transfers = sum(toint(TransferCount))
  by TenantId
"@

$topProductQuery = @"
getSEDICSupportRequestsTbl
| where Program == 'MCS' and ServiceRequestState =~ 'Open'
| summarize openCases = count() by TenantId, ProductGroup = iif(ProductGroup == 'Purview All Up', 'Purview', ProductGroup)
| summarize arg_max(openCases, ProductGroup) by TenantId
| project TenantId, topOpenProductGroup = ProductGroup, topOpenProductCount = openCases
"@

$accessToken = az account get-access-token --resource https://kusto.kusto.windows.net --query accessToken -o tsv
if (-not $accessToken) {
    throw 'Unable to acquire a Kusto access token via Azure CLI.'
}

$headers = @{
    Authorization = "Bearer $accessToken"
    'Content-Type' = 'application/json'
}

function Invoke-KustoQuery {
    param([string]$QueryText)

    $requestBody = @{ db = $database; csl = $QueryText } | ConvertTo-Json
    $response = Invoke-RestMethod -Method Post -Uri $clusterUri -Headers $headers -Body $requestBody
    $primaryTable = $response | Where-Object { $_.FrameType -eq 'DataTable' -and $_.TableKind -eq 'PrimaryResult' } | Select-Object -First 1

    if (-not $primaryTable) {
        throw 'The Kusto response did not contain a primary result table.'
    }

    $columnNames = @($primaryTable.Columns | ForEach-Object { $_.ColumnName })
    $rows = foreach ($row in $primaryTable.Rows) {
        $record = [ordered]@{}
        for ($index = 0; $index -lt $columnNames.Count; $index++) {
            $record[$columnNames[$index]] = $row[$index]
        }
        [pscustomobject]$record
    }

    return $rows
}

$summaryRows = Invoke-KustoQuery -QueryText $summaryQuery
$topProductRows = Invoke-KustoQuery -QueryText $topProductQuery
$topProductByTenant = @{}
foreach ($row in $topProductRows) {
    $topProductByTenant[$row.TenantId] = $row
}

$insights = foreach ($row in $summaryRows) {
    $topProduct = $topProductByTenant[$row.TenantId]
    $irTotal = [int]$row.irMetYes + [int]$row.irMetNo
    $irRate = if ($irTotal -gt 0) { [math]::Round(([int]$row.irMetYes / $irTotal) * 100) } else { 0 }

    [pscustomobject]@{
        tenantId = $row.TenantId
        dataAsOf = (Get-Date).ToUniversalTime().ToString('o')
        openMcsCases = $row.openMcsCases
        openSevAB = $row.openSevAB
        icmLinked = $row.icmLinked
        critSitCases = $row.critSitCases
        irMetRate = "${irRate}%"
        irMetYes = $row.irMetYes
        irMetNo = $row.irMetNo
        avgCaseAgeDays = $row.avgCaseAgeDays
        reopenedCases = $row.reopenedCases
        transfers = $row.transfers
        topOpenProductGroup = if ($topProduct) { $topProduct.topOpenProductGroup } else { '' }
        topOpenProductCount = if ($topProduct) { $topProduct.topOpenProductCount } else { 0 }
    }
}

$outputDirectory = Split-Path -Parent $OutputPath
if (-not (Test-Path $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

$insights | ConvertTo-Json -Depth 6 | Set-Content -Path $OutputPath -Encoding UTF8
Write-Output "Exported $($insights.Count) support insight records to $OutputPath"