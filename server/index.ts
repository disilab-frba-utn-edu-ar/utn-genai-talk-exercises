import { createApp } from "./app"
import { HOST, PORT } from "./config"

createApp().listen(PORT, HOST, () => {
  console.log(`[api] Mentorías a Voluntad escuchando en http://${HOST}:${PORT}/api`)
})
