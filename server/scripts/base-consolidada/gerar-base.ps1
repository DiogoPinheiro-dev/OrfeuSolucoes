param(
  [string]$EnvironmentFile = (Join-Path $PSScriptRoot '..\..\.env'),
  [string]$OutputPath = (Join-Path $PSScriptRoot '..\..\prisma\migrations\20261015160000_base_do_produto\migration.sql')
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Read-DatabaseUrl([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Arquivo de ambiente nao encontrado: $Path"
  }

  $line = Get-Content -LiteralPath $Path |
    Where-Object { $_ -match '^DATABASE_URL=' } |
    Select-Object -First 1

  if (-not $line) {
    throw 'DATABASE_URL nao foi encontrada no arquivo de ambiente.'
  }

  return $line.Substring($line.IndexOf('=') + 1).Trim('"')
}

function Read-ConnectionPart([string]$Url, [string]$Name) {
  $match = [regex]::Match($Url, "(?:^|;)$Name=([^;]+)", 'IgnoreCase')
  if (-not $match.Success) {
    throw "DATABASE_URL nao possui o parametro $Name."
  }

  return $match.Groups[1].Value
}

Import-Module SQLPS -DisableNameChecking

$databaseUrl = Read-DatabaseUrl $EnvironmentFile
$hostMatch = [regex]::Match($databaseUrl, '^sqlserver://([^;]+)', 'IgnoreCase')
if (-not $hostMatch.Success) {
  throw 'DATABASE_URL nao usa o formato sqlserver:// esperado.'
}

$serverName = $hostMatch.Groups[1].Value -replace ':', ','
$databaseName = Read-ConnectionPart $databaseUrl 'database'
$userName = Read-ConnectionPart $databaseUrl 'user'
$password = Read-ConnectionPart $databaseUrl 'password'

$connection = New-Object Microsoft.SqlServer.Management.Common.ServerConnection($serverName, $userName, $password)
$server = New-Object Microsoft.SqlServer.Management.Smo.Server($connection)

try {
  $database = $server.Databases[$databaseName]
  if (-not $database) {
    throw "Banco de dados nao encontrado: $databaseName"
  }

  $tables = @($database.Tables |
    Where-Object { -not $_.IsSystemObject -and $_.Name -ne '_prisma_migrations' } |
    Sort-Object Schema, Name)

  if ($tables.Count -eq 0) {
    throw 'O banco de referencia nao possui tabelas de produto.'
  }

  $options = New-Object Microsoft.SqlServer.Management.Smo.ScriptingOptions
  $options.AllowSystemObjects = $false
  $options.AnsiFile = $true
  $options.ContinueScriptingOnError = $false
  $options.DriAll = $true
  $options.FullTextIndexes = $true
  $options.IncludeDatabaseContext = $false
  $options.IncludeHeaders = $false
  $options.Indexes = $true
  $options.NoFileGroup = $true
  $options.Permissions = $false
  $options.SchemaQualify = $true
  $options.ScriptBatchTerminator = $false
  $options.ScriptData = $false
  $options.ScriptDrops = $false
  $options.ScriptOwner = $false
  $options.ScriptSchema = $true
  $options.Triggers = $true
  $options.WithDependencies = $true

  $scripter = New-Object Microsoft.SqlServer.Management.Smo.Scripter($server)
  $scripter.Options = $options
  $urns = New-Object Microsoft.SqlServer.Management.Smo.UrnCollection
  foreach ($table in $tables) {
    [void]$urns.Add($table.Urn)
  }

  $body = @($scripter.Script($urns)) |
    Where-Object { $_ -and $_.Trim().Length -gt 0 }

  $header = @(
    '-- Base consolidada gerada a partir do esquema SQL Server validado.',
    '-- Nao editar manualmente: use server/scripts/base-consolidada/gerar-base.ps1.',
    'SET XACT_ABORT ON;',
    'BEGIN TRY',
    '  BEGIN TRANSACTION;',
    '',
    "  IF EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID(N'dbo') AND name <> N'_prisma_migrations')",
    "    THROW 51000, 'Banco existente detectado. Execute npm run banco:transicao antes de aplicar a base consolidada.', 1;",
    ''
  )
  $footer = @(
    '',
    '  COMMIT TRANSACTION;',
    'END TRY',
    'BEGIN CATCH',
    '  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;',
    '  THROW;',
    'END CATCH;'
  )

  $destination = [System.IO.Path]::GetFullPath($OutputPath)
  $directory = Split-Path -Parent $destination
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
  # LF fixo: o checksum gravado pelo Prisma depende dos bytes do arquivo (ver .gitattributes).
  $content = (@($header + $body + $footer) -join "`n`n") -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($destination, $content + "`n", [System.Text.UTF8Encoding]::new($false))

  Write-Host "Base consolidada gerada com $($tables.Count) tabelas em $destination."
}
finally {
  if ($connection) {
    $connection.Disconnect()
  }
}
