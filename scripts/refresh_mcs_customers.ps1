param(
    [string]$OutputPath = "C:\Users\jinruishao\MCS-Portal\data\mcs-customers.json"
)

$clusterUri = 'https://cxedataplatformcluster.westus2.kusto.windows.net/v2/rest/query'
$database = 'cxedata'
$query = @"
getMCSCustomersTbl
| where ParticipantStage == 'Active' and isnotempty(CRMCustomerName)
| summarize arg_max(UpdatedDateTime, *) by CRMCustomerName
| project
    customerName = CRMCustomerName,
    participantStage = ParticipantStage,
    participantStatus = ProgramParticipantStatus,
    technologyVertical = TechnologyVertical,
    onboardDate = OnboardDate,
    contractExpiryDate = ContractExpiryDate,
    executiveSponsor = ExecutiveSponsor,
    ownerName = OwnerName,
    assignedPm = ParticipantAssignedPM,
    assignedEngineer1 = AssignedEngineer1,
    assignedEngineer2 = AssignedEngineer2,
    supportRegion = SupportRegion,
    supportTimeZone = SupportTimeZone,
    otherPrograms = OtherProgramsCustomerIsIncludedIn,
    customerOverview = CustomerOverview,
    keyThingsToKnow = KeyThingsToKnow,
    crmUrl = ProgramParticipantURL,
    lastUpdated = UpdatedDateTime
| order by customerName asc
"@

$accessToken = az account get-access-token --resource https://kusto.kusto.windows.net --query accessToken -o tsv
if (-not $accessToken) {
    throw 'Unable to acquire a Kusto access token via Azure CLI.'
}

$headers = @{
    Authorization = "Bearer $accessToken"
    'Content-Type' = 'application/json'
}

$requestBody = @{ db = $database; csl = $query } | ConvertTo-Json
$response = Invoke-RestMethod -Method Post -Uri $clusterUri -Headers $headers -Body $requestBody
$primaryTable = $response | Where-Object { $_.FrameType -eq 'DataTable' -and $_.TableKind -eq 'PrimaryResult' } | Select-Object -First 1

if (-not $primaryTable) {
    throw 'The Kusto response did not contain a primary result table.'
}

$columnNames = @($primaryTable.Columns | ForEach-Object { $_.ColumnName })
$customers = foreach ($row in $primaryTable.Rows) {
    $record = [ordered]@{}
    for ($index = 0; $index -lt $columnNames.Count; $index++) {
        $record[$columnNames[$index]] = $row[$index]
    }

    [pscustomobject]$record
}

$outputDirectory = Split-Path -Parent $OutputPath
if (-not (Test-Path $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

$customers | ConvertTo-Json -Depth 6 | Set-Content -Path $OutputPath -Encoding UTF8
Write-Output "Exported $($customers.Count) MCS customers to $OutputPath"