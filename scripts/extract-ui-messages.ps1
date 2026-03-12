param(
  [string]$SrcRoot = (Join-Path $PSScriptRoot '..\\src'),
  [string]$OutFile = (Join-Path $PSScriptRoot '..\\docs\\ui-messages.md'),
  [string]$OutFileEn = (Join-Path $PSScriptRoot '..\\docs\\ui-messages.en.md'),
  [string]$OutCopy = (Join-Path $PSScriptRoot '..\\docs\\ui-messages.copy.txt')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-LineNumberFromIndex {
  param(
    [Parameter(Mandatory = $true)][string]$Content,
    [Parameter(Mandatory = $true)][int]$Index
  )
  if ($Index -le 0) { return 1 }
  return ($Content.Substring(0, [Math]::Min($Index, $Content.Length)) -split "`n").Count
}

function Read-JsStringLiteral {
  param(
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Content,
    [Parameter(Mandatory = $true)][int]$StartIndex
  )
  if ($StartIndex -ge $Content.Length) { return $null }

  $quote = $Content[$StartIndex]
  if ($quote -ne "'" -and $quote -ne '"' -and $quote -ne '`') { return $null }

  $i = $StartIndex + 1
  $sb = New-Object System.Text.StringBuilder
  $len = $Content.Length

  while ($i -lt $len) {
    $ch = $Content[$i]

    if ($quote -ne '`' -and $ch -eq '\') {
      if ($i + 1 -lt $len) {
        [void]$sb.Append($Content[$i])
        $i++
        [void]$sb.Append($Content[$i])
        $i++
        continue
      }
    }

    if ($quote -eq '`') {
      if ($ch -eq '`') {
        return @{
          raw = $Content.Substring($StartIndex, ($i - $StartIndex + 1))
          value = $sb.ToString()
          end = $i + 1
        }
      }
      [void]$sb.Append($ch)
      $i++
      continue
    }

    if ($ch -eq $quote) {
      return @{
        raw = $Content.Substring($StartIndex, ($i - $StartIndex + 1))
        value = $sb.ToString()
        end = $i + 1
      }
    }

    [void]$sb.Append($ch)
    $i++
  }

  return $null
}

function Find-MatchingBraceBlock {
  param(
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Content,
    [Parameter(Mandatory = $true)][int]$OpenBraceIndex
  )
  if ($OpenBraceIndex -ge $Content.Length -or $Content[$OpenBraceIndex] -ne '{') { return $null }

  $depth = 0
  $i = $OpenBraceIndex
  $len = $Content.Length

  while ($i -lt $len) {
    $ch = $Content[$i]

    if ($ch -eq "'" -or $ch -eq '"' -or $ch -eq '`') {
      $lit = Read-JsStringLiteral -Content $Content -StartIndex $i
      if ($null -ne $lit) {
        $i = $lit.end
        continue
      }
    }

    if ($ch -eq '{') { $depth++ }
    elseif ($ch -eq '}') {
      $depth--
      if ($depth -eq 0) {
        return @{
          start = $OpenBraceIndex
          end = $i + 1
          text = $Content.Substring($OpenBraceIndex, ($i - $OpenBraceIndex + 1))
        }
      }
    }

    $i++
  }

  return $null
}

function Scan-CallSites {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Content,
    [Parameter(Mandatory = $true)][string]$CalleePattern,
    [Parameter(Mandatory = $true)][string]$TypeLabel
  )

  $records = New-Object System.Collections.Generic.List[object]
  $regex = [regex]::new($CalleePattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

  foreach ($m in $regex.Matches($Content)) {
    $method = $m.Groups['method'].Value
    $callStart = $m.Index
    $openParen = $Content.IndexOf('(', $callStart)
    if ($openParen -lt 0) { continue }

    $i = $openParen + 1
    while ($i -lt $Content.Length -and [char]::IsWhiteSpace($Content[$i])) { $i++ }

    $line = Get-LineNumberFromIndex -Content $Content -Index $callStart
    $location = "$FilePath`:$line"

    $lit = Read-JsStringLiteral -Content $Content -StartIndex $i
    if ($null -ne $lit) {
      $records.Add([pscustomobject]@{
          type = $TypeLabel
          method = $method
          content = $lit.value
          location = $location
        })
      continue
    }

    $records.Add([pscustomobject]@{
        type = $TypeLabel
        method = $method
        content = '<dynamic>'
        location = $location
      })
  }

  return $records
}

function Scan-ModalObjectCalls {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Content,
    [Parameter(Mandatory = $true)][string]$CalleePattern,
    [Parameter(Mandatory = $true)][string]$TypeLabel
  )

  $records = New-Object System.Collections.Generic.List[object]
  $regex = [regex]::new($CalleePattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

  foreach ($m in $regex.Matches($Content)) {
    $method = $m.Groups['method'].Value
    $callStart = $m.Index
    $openParen = $Content.IndexOf('(', $callStart)
    if ($openParen -lt 0) { continue }

    $i = $openParen + 1
    while ($i -lt $Content.Length -and [char]::IsWhiteSpace($Content[$i])) { $i++ }

    $line = Get-LineNumberFromIndex -Content $Content -Index $callStart
    $location = "$FilePath`:$line"

    if ($i -ge $Content.Length -or $Content[$i] -ne '{') {
      $records.Add([pscustomobject]@{
          type = $TypeLabel
          method = $method
          content = '<dynamic>'
          location = $location
        })
      continue
    }

    $block = Find-MatchingBraceBlock -Content $Content -OpenBraceIndex $i
    if ($null -eq $block) { continue }

    $objText = $block.text
    $propRegex = [regex]::new('(?<prop>title|content|okText|cancelText)\s*:\s*(?<q>[''\"`])', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    foreach ($pm in $propRegex.Matches($objText)) {
      $prop = $pm.Groups['prop'].Value
      $qIndex = $block.start + $pm.Index + $pm.Length - 1
      $lit = Read-JsStringLiteral -Content $Content -StartIndex $qIndex
      if ($null -ne $lit) {
        $records.Add([pscustomobject]@{
            type = $TypeLabel
            method = "$method.$prop"
            content = $lit.value
            location = $location
          })
      }
    }
  }

  return $records
}

function Scan-ValidationMessages {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath
  )

  $records = New-Object System.Collections.Generic.List[object]
  $lines = @(Get-Content -LiteralPath $FilePath -Encoding UTF8)
  for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    if ($line -notmatch '\bmessage\s*:\s*(?<q>[''\"`])') { continue }

    $start = [Math]::Max(0, $i - 3)
    $window = ($lines[$start..$i] -join "`n")
    if ($window -notmatch '\brules\b') { continue }

    $m = [regex]::Match($line, '\bmessage\s*:\s*(?<q>[''\"`])')
    if (-not $m.Success) { continue }

    $startCol = $m.Index + $m.Length - 1
    $lit = Read-JsStringLiteral -Content $line -StartIndex $startCol
    if ($null -eq $lit) { continue }

    $records.Add([pscustomobject]@{
        type = 'Validation message'
        method = 'rules.message'
        content = $lit.value
        location = "$FilePath`:$($i + 1)"
      })
  }

  return $records
}

function Remove-Diacritics {
  param([Parameter(Mandatory = $true)][string]$Text)
  $formD = $Text.Normalize([Text.NormalizationForm]::FormD)
  $noMarks = [regex]::Replace($formD, '\p{Mn}', '')
  $lowerD = [string][char]0x0111
  $upperD = [string][char]0x0110
  return (($noMarks -replace $lowerD, 'd') -replace $upperD, 'D')
}

function Translate-MessageToEnglish {
  param([Parameter(Mandatory = $true)][string]$Text)

  if ($Text -eq '<dynamic>') { return '<dynamic>' }

  $key = (Remove-Diacritics -Text $Text).ToLowerInvariant()

  switch ($key) {
    'chua thanh toan' { return 'Payment not completed yet.' }
    'booking da bi huy. giuong da duoc giai phong.' { return 'Booking was cancelled. The bed has been released.' }
    'ban da co booking trong ky nay' { return 'You already have a booking this semester.' }
    'ban da co mot booking dang hoat dong cho ky hoc nay.' { return 'You already have an active booking for this semester.' }
    'vui long kiem tra tab my requests de xem hoac hoan tat thanh toan cho booking hien tai.' { return 'Please check the My Requests tab to view or complete payment for your current booking.' }
    'xem my requests' { return 'View My Requests' }
    default { return $Text }
  }
}

if (-not (Test-Path -LiteralPath $SrcRoot)) {
  throw "SrcRoot not found: $SrcRoot"
}

$outDir = Split-Path -Parent $OutFile
if (-not (Test-Path -LiteralPath $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

$files = Get-ChildItem -LiteralPath $SrcRoot -Recurse -File -Include *.ts, *.tsx
$all = New-Object System.Collections.Generic.List[object]

foreach ($f in $files) {
  $content = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8

  foreach ($r in Scan-CallSites -FilePath $f.FullName -Content $content -CalleePattern '\bmessage\.(?<method>success|error|warning|info)\s*\(' -TypeLabel 'Toast message') { $all.Add($r) }
  foreach ($r in Scan-CallSites -FilePath $f.FullName -Content $content -CalleePattern '\bnotification\.(?<method>open|success|error|warning|info)\s*\(' -TypeLabel 'Notification') { $all.Add($r) }
  foreach ($r in Scan-ModalObjectCalls -FilePath $f.FullName -Content $content -CalleePattern '\bappModal\.(?<method>success|error|warning|info|confirm)\s*\(' -TypeLabel 'Modal dialog') { $all.Add($r) }
  foreach ($r in Scan-ModalObjectCalls -FilePath $f.FullName -Content $content -CalleePattern '\bmodalApi\.(?<method>success|error|warning|info|confirm)\s*\(' -TypeLabel 'Modal dialog') { $all.Add($r) }
  foreach ($r in Scan-ModalObjectCalls -FilePath $f.FullName -Content $content -CalleePattern '\bModal\.(?<method>success|error|warning|info|confirm)\s*\(' -TypeLabel 'Modal dialog') { $all.Add($r) }
  foreach ($r in Scan-ValidationMessages -FilePath $f.FullName) { $all.Add($r) }
}

$groups = $all |
  Group-Object -Property type, method, content |
  Sort-Object { $_.Group[0].type }, { $_.Group[0].method }, { $_.Group[0].content }

$rows = New-Object System.Collections.Generic.List[object]
$code = 1
foreach ($g in $groups) {
  $first = $g.Group[0]
  $locations = @($g.Group | Select-Object -ExpandProperty location | Sort-Object -Unique)

  $locText =
  if ($locations.Length -le 3) { $locations -join '; ' }
  else { ($locations[0..2] -join '; ') + "; (+$($locations.Length - 3) more)" }

  $rows.Add([pscustomobject]@{
      Code = ('MSG{0:000}' -f $code)
      Type = $first.type
      Method = $first.method
      Context = $locText
      Content = $first.content
    })
  $code++
}

$total = $rows.Count
$dynamicCount = ($rows | Where-Object { $_.Content -eq '<dynamic>' }).Count
$staticCount = $total - $dynamicCount

$md = New-Object System.Text.StringBuilder
[void]$md.AppendLine('# UI Message Catalog (Extracted)')
[void]$md.AppendLine()
[void]$md.AppendLine("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$md.AppendLine("Source root: $SrcRoot")
[void]$md.AppendLine()
[void]$md.AppendLine("Total unique entries: $total (static: $staticCount, dynamic: $dynamicCount)")
[void]$md.AppendLine()
[void]$md.AppendLine('| Message code | Message type | Context | Content |')
[void]$md.AppendLine('|---|---|---|---|')

foreach ($r in $rows) {
  $contentEsc = ($r.Content -replace '\|', '\\|').Trim()
  $ctxEsc = ($r.Context -replace '\|', '\\|').Trim()
  [void]$md.AppendLine("| $($r.Code) | $($r.Type) ($($r.Method)) | $ctxEsc | $contentEsc |")
}

Set-Content -LiteralPath $OutFile -Value $md.ToString() -Encoding UTF8
Write-Host "Wrote: $OutFile"

$mdEn = New-Object System.Text.StringBuilder
[void]$mdEn.AppendLine('# UI Message Catalog (English)')
[void]$mdEn.AppendLine()
[void]$mdEn.AppendLine("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$mdEn.AppendLine("Source root: $SrcRoot")
[void]$mdEn.AppendLine()
[void]$mdEn.AppendLine("Total unique entries: $total (static: $staticCount, dynamic: $dynamicCount)")
[void]$mdEn.AppendLine()
[void]$mdEn.AppendLine('| Message code | Message type | Context | Content (EN) | Original content |')
[void]$mdEn.AppendLine('|---|---|---|---|---|')

foreach ($r in $rows) {
  $original = $r.Content
  $translated = Translate-MessageToEnglish -Text $original

  $translatedEsc = ($translated -replace '\|', '\\|').Trim()
  $originalEsc = ($original -replace '\|', '\\|').Trim()
  $ctxEsc = ($r.Context -replace '\|', '\\|').Trim()

  [void]$mdEn.AppendLine("| $($r.Code) | $($r.Type) ($($r.Method)) | $ctxEsc | $translatedEsc | $originalEsc |")
}

Set-Content -LiteralPath $OutFileEn -Value $mdEn.ToString() -Encoding UTF8
Write-Host "Wrote: $OutFileEn"

$copy = New-Object System.Text.StringBuilder
[void]$copy.AppendLine("Total: $total (static: $staticCount, dynamic: $dynamicCount)")
[void]$copy.AppendLine("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$copy.AppendLine()

$n = 1
foreach ($r in $rows) {
  $original = $r.Content
  $translated = Translate-MessageToEnglish -Text $original
  $line = "MGS$($n): $translated"
  [void]$copy.AppendLine($line)
  $n++
}

Set-Content -LiteralPath $OutCopy -Value $copy.ToString() -Encoding UTF8
Write-Host "Wrote: $OutCopy"
