$file = 'c:\Users\AMOS\Pictures\bagg\app\(store)\checkout\page.tsx'
$content = Get-Content $file -Raw
$content = $content -replace 'House number and street name', '123 Main St, Apt 4B'
$content = $content -replace 'placeholder="John"', 'placeholder="John"'
Set-Content $file $content -NoNewline
Write-Host 'Done - address placeholder updated'
