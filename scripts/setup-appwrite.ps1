$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $rootDir ".env.local"

if (Test-Path $envPath) {
  Get-Content -Path $envPath | ForEach-Object {
    $line = $_.Trim()

    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
      return
    }

    $parts = $line.Split("=", 2)
    $key = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"')

    if (-not [string]::IsNullOrWhiteSpace($key) -and [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($key))) {
      [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
  }
}

$requiredEnvKeys = @(
  "APPWRITE_PROJECT_ID",
  "APPWRITE_API_KEY"
)

foreach ($key in $requiredEnvKeys) {
  if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($key))) {
    throw "Missing required environment variable: $key"
  }
}

$endpoint = "https://fra.cloud.appwrite.io/v1"
$projectId = [Environment]::GetEnvironmentVariable("APPWRITE_PROJECT_ID")
$apiKey = [Environment]::GetEnvironmentVariable("APPWRITE_API_KEY")
$databaseId = "main"
$vpesCollectionId = "vpes"
$evaluatorsCollectionId = "evaluators"
$invitationsCollectionId = "invitations"
$storageBucketId = "evaluator-photos"

$headers = @{
  "Content-Type" = "application/json"
  "X-Appwrite-Project" = $projectId
  "X-Appwrite-Key" = $apiKey
  "X-Appwrite-Response-Format" = "1.8.0"
}

function Invoke-AppwriteJson {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [string]$Method = "GET",
    [object]$Body = $null,
    [int[]]$ExpectedStatusCodes = @(200)
  )

  $uri = "$endpoint$Path"
  $jsonBody = if ($null -ne $Body) { $Body | ConvertTo-Json -Depth 20 -Compress } else { $null }

  try {
    return Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $jsonBody
  } catch {
    $statusCode = [int]$_.Exception.Response.StatusCode

    if ($ExpectedStatusCodes -contains $statusCode) {
      if ($_.ErrorDetails.Message) {
        return $_.ErrorDetails.Message | ConvertFrom-Json
      }

      return $null
    }

    throw
  }
}

function Get-AppwriteMaybe {
  param([Parameter(Mandatory = $true)][string]$Path)

  try {
    return Invoke-RestMethod -Uri "$endpoint$Path" -Method GET -Headers $headers
  } catch {
    $statusCode = [int]$_.Exception.Response.StatusCode

    if ($statusCode -eq 404) {
      return $null
    }

    throw
  }
}

function Wait-ForAppwriteResource {
  param(
    [Parameter(Mandatory = $true)][scriptblock]$Loader,
    [Parameter(Mandatory = $true)][string]$Label
  )

  $deadline = (Get-Date).AddMinutes(2)

  while ((Get-Date) -lt $deadline) {
    $resource = & $Loader
    $status = "$($resource.status)".ToLowerInvariant()

    if ($status -in @("available", "enabled", "ready")) {
      return
    }

    if ($status -in @("failed", "stuck")) {
      throw "$Label entered a failed state."
    }

    Start-Sleep -Milliseconds 1500
  }

  throw "Timed out while waiting for $Label."
}

function Ensure-Database {
  $existing = Get-AppwriteMaybe -Path "/databases/$databaseId"

  if ($null -ne $existing) {
    Write-Host "Database already exists: $databaseId"
    return
  }

  Write-Host "Creating database: $databaseId"
  Invoke-AppwriteJson -Path "/databases" -Method "POST" -Body @{
    databaseId = $databaseId
    name = "Toast Masters Hub"
    enabled = $true
  } -ExpectedStatusCodes @(201) | Out-Null
}

function Ensure-Collection {
  param(
    [Parameter(Mandatory = $true)][string]$CollectionId,
    [Parameter(Mandatory = $true)][string]$Name
  )

  $existing = Get-AppwriteMaybe -Path "/databases/$databaseId/collections/$CollectionId"

  if ($null -ne $existing) {
    Write-Host "Collection already exists: $CollectionId"
    return
  }

  Write-Host "Creating collection: $CollectionId"
  Invoke-AppwriteJson -Path "/databases/$databaseId/collections" -Method "POST" -Body @{
    collectionId = $CollectionId
    name = $Name
    permissions = @()
    documentSecurity = $false
    enabled = $true
  } -ExpectedStatusCodes @(201) | Out-Null
}

function Get-Attributes {
  param([Parameter(Mandatory = $true)][string]$CollectionId)

  $response = Invoke-AppwriteJson -Path "/databases/$databaseId/collections/$CollectionId/attributes"
  return @($response.attributes)
}

function Get-Indexes {
  param([Parameter(Mandatory = $true)][string]$CollectionId)

  $response = Invoke-AppwriteJson -Path "/databases/$databaseId/collections/$CollectionId/indexes"
  return @($response.indexes)
}

function Ensure-Attribute {
  param(
    [Parameter(Mandatory = $true)][string]$CollectionId,
    [Parameter(Mandatory = $true)][hashtable]$Attribute
  )

  $exists = Get-Attributes -CollectionId $CollectionId | Where-Object { $_.key -eq $Attribute.key }

  if ($exists) {
    Write-Host "Attribute already exists: $CollectionId.$($Attribute.key)"
    return
  }

  Write-Host "Creating attribute: $CollectionId.$($Attribute.key)"

  switch ($Attribute.type) {
    "string" {
      Invoke-AppwriteJson -Path "/databases/$databaseId/collections/$CollectionId/attributes/string" -Method "POST" -Body @{
        key = $Attribute.key
        size = $Attribute.size
        required = $Attribute.required
        array = $false
      } -ExpectedStatusCodes @(202) | Out-Null
    }
    "email" {
      Invoke-AppwriteJson -Path "/databases/$databaseId/collections/$CollectionId/attributes/email" -Method "POST" -Body @{
        key = $Attribute.key
        required = $Attribute.required
        array = $false
      } -ExpectedStatusCodes @(202) | Out-Null
    }
    "enum" {
      Invoke-AppwriteJson -Path "/databases/$databaseId/collections/$CollectionId/attributes/enum" -Method "POST" -Body @{
        key = $Attribute.key
        elements = $Attribute.elements
        required = $Attribute.required
        array = $false
      } -ExpectedStatusCodes @(202) | Out-Null
    }
    default {
      throw "Unsupported attribute type: $($Attribute.type)"
    }
  }

  Wait-ForAppwriteResource -Label "attribute $CollectionId.$($Attribute.key)" -Loader {
    Get-Attributes -CollectionId $CollectionId | Where-Object { $_.key -eq $Attribute.key } | Select-Object -First 1
  }
}

function Ensure-Index {
  param(
    [Parameter(Mandatory = $true)][string]$CollectionId,
    [Parameter(Mandatory = $true)][hashtable]$Index
  )

  $exists = Get-Indexes -CollectionId $CollectionId | Where-Object { $_.key -eq $Index.key }

  if ($exists) {
    Write-Host "Index already exists: $CollectionId.$($Index.key)"
    return
  }

  Write-Host "Creating index: $CollectionId.$($Index.key)"
  Invoke-AppwriteJson -Path "/databases/$databaseId/collections/$CollectionId/indexes" -Method "POST" -Body @{
    key = $Index.key
    type = $Index.type
    attributes = $Index.attributes
    orders = $Index.orders
  } -ExpectedStatusCodes @(202) | Out-Null

  Wait-ForAppwriteResource -Label "index $CollectionId.$($Index.key)" -Loader {
    Get-Indexes -CollectionId $CollectionId | Where-Object { $_.key -eq $Index.key } | Select-Object -First 1
  }
}

function Ensure-Bucket {
  $existing = Get-AppwriteMaybe -Path "/storage/buckets/$storageBucketId"

  if ($null -ne $existing) {
    Write-Host "Bucket already exists: $storageBucketId"
    return
  }

  Write-Host "Creating bucket: $storageBucketId"
  Invoke-AppwriteJson -Path "/storage/buckets" -Method "POST" -Body @{
    bucketId = $storageBucketId
    name = "Evaluator Photos"
    permissions = @('read("any")')
    fileSecurity = $false
    enabled = $true
    maximumFileSize = 5242880
    allowedFileExtensions = @("jpg", "jpeg", "png", "webp", "avif")
    compression = "none"
    encryption = $true
    antivirus = $true
    transformations = $true
  } -ExpectedStatusCodes @(201) | Out-Null
}

$collections = @(
  @{
    id = $vpesCollectionId
    name = "VPEs"
    attributes = @(
      @{ type = "string"; key = "full_name"; size = 255; required = $true },
      @{ type = "email"; key = "email"; required = $true },
      @{ type = "string"; key = "access_code_hash"; size = 255; required = $true },
      @{ type = "string"; key = "access_code_last_sent_at"; size = 64; required = $false }
    )
    indexes = @(
      @{ key = "email_unique"; type = "unique"; attributes = @("email"); orders = @("ASC") },
      @{ key = "access_code_hash_unique"; type = "unique"; attributes = @("access_code_hash"); orders = @("ASC") }
    )
  },
  @{
    id = $evaluatorsCollectionId
    name = "Evaluators"
    attributes = @(
      @{ type = "string"; key = "vpe"; size = 64; required = $true },
      @{ type = "string"; key = "full_name"; size = 255; required = $true },
      @{ type = "email"; key = "email"; required = $true },
      @{ type = "string"; key = "phone"; size = 32; required = $true },
      @{ type = "string"; key = "profile"; size = 5000; required = $true },
      @{ type = "string"; key = "photo"; size = 255; required = $true }
    )
    indexes = @(
      @{ key = "vpe_key"; type = "key"; attributes = @("vpe"); orders = @("ASC") },
      @{ key = "email_key"; type = "key"; attributes = @("email"); orders = @("ASC") }
    )
  },
  @{
    id = $invitationsCollectionId
    name = "Invitations"
    attributes = @(
      @{ type = "string"; key = "vpe"; size = 64; required = $true },
      @{ type = "string"; key = "evaluator"; size = 64; required = $true },
      @{ type = "string"; key = "meeting_title"; size = 255; required = $true },
      @{ type = "string"; key = "meeting_date"; size = 128; required = $true },
      @{ type = "string"; key = "meeting_note"; size = 5000; required = $false },
      @{ type = "enum"; key = "status"; elements = @("pending", "accepted", "declined"); required = $true },
      @{ type = "string"; key = "token_hash"; size = 255; required = $true },
      @{ type = "string"; key = "sent_at"; size = 64; required = $false },
      @{ type = "string"; key = "responded_at"; size = 64; required = $false },
      @{ type = "string"; key = "decline_note"; size = 5000; required = $false }
    )
    indexes = @(
      @{ key = "vpe_key"; type = "key"; attributes = @("vpe"); orders = @("ASC") },
      @{ key = "evaluator_key"; type = "key"; attributes = @("evaluator"); orders = @("ASC") },
      @{ key = "vpe_status_key"; type = "key"; attributes = @("vpe", "status"); orders = @("ASC", "ASC") },
      @{ key = "token_hash_unique"; type = "unique"; attributes = @("token_hash"); orders = @("ASC") }
    )
  }
)

Ensure-Database

foreach ($collection in $collections) {
  Ensure-Collection -CollectionId $collection.id -Name $collection.name

  foreach ($attribute in $collection.attributes) {
    Ensure-Attribute -CollectionId $collection.id -Attribute $attribute
  }

  foreach ($index in $collection.indexes) {
    Ensure-Index -CollectionId $collection.id -Index $index
  }
}

Ensure-Bucket

Write-Host ""
Write-Host "Appwrite backend setup is complete."
