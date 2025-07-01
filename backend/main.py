from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from utils.minizinc_runner import run_minizinc
from tempfile import NamedTemporaryFile
import re

app = FastAPI()

# CORS
origins = ["*"]  # Puedes restringir esto en producción
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH_v1 = os.path.join(BASE_DIR, "models", "modelo_desenfreno_parte_1.mzn")
MODEL_PATH_v2 = os.path.join(BASE_DIR, "models", "modelo_desenfreno_parte_2.mzn")

def parse_minizinc_output(output: str) -> dict:
    try:
        lines = output.strip().splitlines()
        result = {
            "orden_escenas": [],
            "costo_total": 0,
            "detalles_por_actor": []
        }

        # Orden de escenas
        orden_match = re.search(r"Orden de escenas: \[(.*?)\]", output)
        if orden_match:
            result["orden_escenas"] = list(map(int, orden_match.group(1).split(",")))

        # Coste total
        costo_total_match = re.search(r"Coste total: (\d+)", output)
        if costo_total_match:
            result["costo_total"] = int(costo_total_match.group(1))

        # Tiempo compartido entre actores a evitar (solo en modelo 2)
        tiempo_compartido_match = re.search(r"Tiempo compartido.*?: (\d+)", output)
        if tiempo_compartido_match:
            result["tiempo_compartido_actores_evitar"] = int(tiempo_compartido_match.group(1))

        # Detalles por actor
        actor_pattern = re.compile(
            # r"Actor(\w+): Escenas \[(\d+)\.\.(\d+)\] Coste = (\d+), Tiempo en estudio = (\d+)"
            r"(\w+): Escenas \[(\d+)\.\.(\d+)\] Coste = (\d+), Tiempo en estudio = (\d+)"
        )
        for line in lines:
            match = actor_pattern.search(line)
            if match:
                actor_info = {
                    "nombre": f"Actor{match.group(1)}",
                    "rango_escenas_inicio": int(match.group(2)),
                    "rango_escenas_fin": int(match.group(3)),
                    "costo": int(match.group(4)),
                    "tiempo_en_estudio": int(match.group(5))
                }
                result["detalles_por_actor"].append(actor_info)

        return result

    except Exception as e:
        return {"error": f"Error al parsear la salida de MiniZinc: {str(e)}"}


@app.post("/parte_1/")
async def parte_1(file: UploadFile = File(...)):
    return await process_file(file, MODEL_PATH_v1)

@app.post("/parte_2/")
async def parte_2(file: UploadFile = File(...)):
    return await process_file(file, MODEL_PATH_v2)

async def process_file(file: UploadFile, model_path: str):
    try:
        with NamedTemporaryFile(delete=False, suffix=".dzn") as temp_file:
            contents = await file.read()
            temp_file.write(contents)
            temp_file_path = temp_file.name

        output = run_minizinc(model_path, temp_file_path)

        parsed_result = parse_minizinc_output(output)

        os.remove(temp_file_path)
        return JSONResponse(content=parsed_result)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
