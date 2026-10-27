# Hook de Cline (Windows): reenvía el evento al logger común del proyecto.
# Se fuerza UTF-8 en la entrada y en la salida hacia node: sin esto las tildes llegan como "??".
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$payload = [Console]::In.ReadToEnd()
$payload | node "$PSScriptRoot/../../scripts/agent-logs/log-hook.mjs" cline
