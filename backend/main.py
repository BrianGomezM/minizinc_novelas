from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import re

from utils.minizinc_runner import run_minizinc

app = FastAPI()

# Permitir llamadas desde el frontend (Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def parse_minizinc_output(output: str) -> dict:
    try:
        lines = output.strip().splitlines()

        # Extraer orden de escenas
        orden_match = re.search(r"Orden de escenas: \[(.*?)\]", lines[0])
        orden = list(map(int, orden_match.group(1).split(","))) if orden_match else []

        # Extraer costo total
        costo_total_match = re.search(r"Costo total: (\d+)", lines[1])
        costo_total = int(costo_total_match.group(1)) if costo_total_match else 0

        # Extraer tiempos por actor
        actores = []
        for line in lines[3:]:
            match = re.match(r"Actor (\w+): (\d+) unidades \(Costo: (\d+)\)", line)
            if match:
                actores.append({
                    "nombre": match.group(1),
                    "tiempo": int(match.group(2)),
                    "costo": int(match.group(3))
                })

        return {
            "orden_escenas": orden,
            "costo_total": costo_total,
            "tiempos_por_actor": actores
        }
    except Exception as e:
        return {"error": f"Error al parsear la salida de MiniZinc: {str(e)}"}

@app.post("/solve/")
async def solve_model(data_file: UploadFile = File(...)):
    try:
        # Guardar el archivo .dzn en data/
        data_path = f"data/{data_file.filename}"
        with open(data_path, "wb") as f:
            shutil.copyfileobj(data_file.file, f)

        # Ruta del modelo
        model_path = "models/modelo_telenovela.mzn"

        # Ejecutar MiniZinc
        output = run_minizinc(model_path, data_path)

        # Convertir resultado a JSON estructurado
        parsed_output = parse_minizinc_output(output)

        return parsed_output

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar la solicitud: {str(e)}")
