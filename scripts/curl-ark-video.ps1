# 直连方舟 POST /chat/completions，调试 video_url 多模态（视频链需方舟服务器可拉取，勿 403/内网）
# 用法: .\scripts\curl-ark-video.ps1 -VideoUrl "https://你的视频地址"
param(
  [Parameter(Mandatory = $true)]
  [string] $VideoUrl
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$m = Select-String -Path .env.local -Pattern '^LLM_API_KEY=(.+)$'
if (-not $m) { throw "LLM_API_KEY not found in .env.local" }
$key = $m.Matches[0].Groups[1].Value.Trim()

$mModel = Select-String -Path .env.local -Pattern '^LLM_VIDEO_PARSE_MODEL=(.+)$'
$model = if ($mModel) { $mModel.Matches[0].Groups[1].Value.Trim() } else { "doubao-seed-2-0-pro-260215" }

$tmp = Join-Path $env:TEMP "ark-video-body.json"
$bodyObj = [ordered]@{
  model       = $model
  messages    = @(
    @{
      role    = "user"
      content = @(
        @{ type = "text"; text = "详细分析这个视频：画面内容、人物动作、语音内容、总结" }
        @{ type = "video_url"; video_url = @{ url = $VideoUrl } }
      )
    }
  )
  temperature = 0.38
  max_tokens  = 1024
}
$json = $bodyObj | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($tmp, $json, [System.Text.UTF8Encoding]::new($false))

Write-Host "POST https://ark.cn-beijing.volces.com/api/v3/chat/completions"
Write-Host "model: $model"
Write-Host ""

curl.exe -s -S -w "`nHTTP:%{http_code}`n" `
  -X POST "https://ark.cn-beijing.volces.com/api/v3/chat/completions" `
  -H "Authorization: Bearer $key" `
  -H "Content-Type: application/json; charset=utf-8" `
  --data-binary "@$tmp"
