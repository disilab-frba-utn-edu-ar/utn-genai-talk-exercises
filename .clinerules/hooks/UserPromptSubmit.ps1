# Hook de Cline (Windows): reenvía el evento al logger común del proyecto.
$payload = [Console]::In.ReadToEnd()
$payload | node "$PSScriptRoot/../../scripts/agent-logs/log-hook.mjs" cline
