import sys
filepath = r"C:\Users\Alumno\Desktop\Nueva carpeta (3)\utn-genai-talk-exercises\tests\server\api\sesiones.test.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace("El horario ya está reservado", "El horario se superpone con otra sesión de la mentora")
with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Done")