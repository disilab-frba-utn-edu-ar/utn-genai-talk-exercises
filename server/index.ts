import { createApp } from "./app"
import { PORT } from "./config"

createApp().listen(PORT, () => {
  console.log(`[api] Mentorías a Voluntad escuchando en http://localhost:${PORT}/api`)
})
