# Build & deploy itunda.org (Vite SPA in iTunda.Web, outDir=dist)
# Usage:  powershell -File publish.ps1 [-Install]
[CmdletBinding()]
param([switch]$Install)

Import-Module C:\inetpub\repos\_lib\deploy.psm1 -Force
Invoke-StaticDeploy `
  -RepoDir      $PSScriptRoot `
  -WorkingDir   'iTunda.Web' `
  -BuildDir     'dist' `
  -LiveDirs     @('C:\inetpub\wwwroot\itunda.org') `
  -PreserveDirs @('dl') `
  -SmokeHosts   @('itunda.org') `
  -Install:$Install
