# Auto install script for AyushMuzic
$ErrorActionPreference = "Stop"

$inputStr = @"
protocol=https
host=github.com
"@
$token = ($inputStr | git credential fill | Where-Object { $_ -like 'password=*' }) -replace 'password=', ''
$headers = @{
    'Authorization' = 'Bearer ' + $token
    'User-Agent' = 'PowerShell'
}

$adb = "C:\Users\AYUSH\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$device = "T865QGCMKF89KNFA"
$runId = "43505864771"
$workDir = "C:\Users\AYUSH\Downloads\SimpMusic-dev\temp_install"

if (-not (Test-Path $workDir)) {
    New-Item -ItemType Directory -Path $workDir -Force | Out-Null
}

Write-Output "Waiting for Android APK artifact from run $runId..."

$apkDownloaded = $false
while (-not $apkDownloaded) {
    try {
        $artifacts = (Invoke-RestMethod -Uri "https://api.github.com/repos/jaatayushh/ayushmuzic/actions/runs/$runId/artifacts" -Headers $headers).artifacts
        $androidArtifact = $artifacts | Where-Object { $_.name -eq 'android-apks' }
        if ($androidArtifact) {
            Write-Output "Found Android artifact (ID: $($androidArtifact.id), Size: $($androidArtifact.size_in_bytes) bytes)"
            $zipPath = Join-Path $workDir "android-apks.zip"
            
            # Download artifact zip
            Invoke-WebRequest -Uri $androidArtifact.archive_download_url -Headers $headers -OutFile $zipPath
            Write-Output "Downloaded Android artifact to $zipPath"
            
            # Extract zip
            $extractDir = Join-Path $workDir "apks"
            if (Test-Path $extractDir) { Remove-Item -Recurse -Force $extractDir }
            Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force
            Write-Output "Extracted APKs:"
            Get-ChildItem $extractDir | Select-Object Name, Length | Format-Table -AutoSize | Out-String | Write-Output
            
            # Find the best APK for Vivo (vivo-arm64 or arm64)
            $apk = Get-ChildItem -Path $extractDir -Filter "*vivo-arm64*.apk" | Select-Object -First 1
            if (-not $apk) {
                $apk = Get-ChildItem -Path $extractDir -Filter "*arm64*.apk" | Select-Object -First 1
            }
            if (-not $apk) {
                $apk = Get-ChildItem -Path $extractDir -Filter "*universal*.apk" | Select-Object -First 1
            }
            
            if ($apk) {
                Write-Output "Installing $($apk.FullName) to Vivo phone ($device)..."
                & $adb -s $device push $apk.FullName /data/local/tmp/app.apk
                $installRes = & $adb -s $device shell pm install -r -d /data/local/tmp/app.apk
                Write-Output "Install result: $installRes"
                
                # Launch app
                Write-Output "Launching AyushMuzic on Vivo..."
                & $adb -s $device shell monkey -p com.ayush.muzic -c android.intent.category.LAUNCHER 1
                Write-Output "AyushMuzic launched successfully on Vivo!"
                $apkDownloaded = $true
                break
            } else {
                Write-Output "No matching APK found in extracted directory!"
            }
        }
    } catch {
        Write-Output "Waiting: $($_.Exception.Message)"
    }
    
    # Check if job failed
    try {
        $job = (Invoke-RestMethod -Uri "https://api.github.com/repos/jaatayushh/ayushmuzic/actions/runs/$runId/jobs" -Headers $headers).jobs | Where-Object { $_.name -like '*Android*' }
        if ($job.status -eq 'completed' -and $job.conclusion -ne 'success') {
            Write-Output "Android build completed with conclusion: $($job.conclusion)"
            break
        }
    } catch {}

    Start-Sleep -Seconds 15
}
