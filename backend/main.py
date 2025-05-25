from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import os
from utils.minizinc_runner import run_minizinc
from tempfile import NamedTemporaryFile
import re

app = FastAPI()

# Ruta absoluta al archivo MiniZinc en la carpeta models
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "modelo_telenovela.mzn")

def parse_minizinc_output(output: str) -> dict:
    try:
        lines = output.strip().splitlines()
        result = {}

        orden_match = re.search(r"Orden de escenas: \[(.*?)\]", output)
        result["orden_escenas"] = list(map(int, orden_match.group(1).split(","))) if orden_match else []

        costo_total_match = re.search(r"Costo total: (\d+)", output)
        result["costo_total"] = int(costo_total_match.group(1)) if costo_total_match else 0

        tiempo_espera_match = re.search(r"Tiempo compartido actores a evitar: (\d+)", output)
        result["tiempo_compartido_actores_evitar"] = int(tiempo_espera_match.group(1)) if tiempo_espera_match else 0

        actores = []
        actor_pattern = re.compile(r"Actor (\w+): (\d+)->(\d+) \((\d+)u, Costo: (\d+)\)")
        for line in lines:
            match = actor_pattern.search(line)
            if match:
                actores.append({
                    "nombre": match.group(1),
                    "rango_escenas_inicio": int(match.group(2)),
                    "rango_escenas_fin": int(match.group(3)),
                    "unidades": int(match.group(4)),
                    "costo": int(match.group(5))
                })
        result["tiempos_por_actor"] = actores

        return result

    except Exception as e:
        return {"error": f"Error al parsear la salida de MiniZinc: {str(e)}"}

@app.post("/run-minizinc/")
async def run_minizinc_service(file: UploadFile = File(...)):
    try:
        # Guardar el archivo .dzn temporalmente
        with NamedTemporaryFile(delete=False, suffix=".dzn") as temp_file:
            contents = await file.read()
            temp_file.write(contents)
            temp_file_path = temp_file.name

        # Ejecutar MiniZinc
        output = run_minizinc(MODEL_PATH, temp_file_path)
        print(f"Salida de MiniZinc: {output}")

        # Parsear el resultado
        parsed_result = parse_minizinc_output(output)

        # Eliminar el archivo temporal
        os.remove(temp_file_path)

        return JSONResponse(content=parsed_result)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
