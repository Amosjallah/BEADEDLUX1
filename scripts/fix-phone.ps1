$file = 'c:\Users\AMOS\Pictures\bagg\app\(store)\checkout\page.tsx'
$content = Get-Content $file -Raw
$content = $content -replace '\+233 XX XXX XXXX', '+1 (XXX) XXX-XXXX'
Set-Content $file $content -NoNewline
Write-Host 'Done - phone placeholder updated'
