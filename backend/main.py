import asyncio
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from utils.minizinc_runner import run_minizinc, wait_for_process, kill_process
from tempfile import NamedTemporaryFile
import re
import uuid

app = FastAPI()

# CORS
origins = ["*"]
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

# 🌟 Control de concurrencia
MAX_CONCURRENT_TASKS = 2
active_tasks = {}  # task_id -> process
semaphore = asyncio.Semaphore(MAX_CONCURRENT_TASKS)


def log_status():
    running = len(active_tasks)
    free = MAX_CONCURRENT_TASKS - running
    print(f"📊 Estado actual: {running} procesos activos, {free} slots libres.")
    if active_tasks:
        print("🟢 Procesos activos (task_id: PID):")
        for tid, proc in active_tasks.items():
            print(f"   - {tid}: PID={proc.pid}")
    else:
        print("⚪ No hay procesos activos.")


def parse_minizinc_output(stdout, stderr, returncode):
    """
    Parsea la salida de MiniZinc o devuelve un error amigable.
    """
    if returncode == -999:
        return {
            "error": "⚠️ La tarea fue cancelada porque se alcanzó el máximo de procesos concurrentes permitidos (2)."
        }

    if returncode != 0:
        # ⚠️ Filtra advertencias de MiniZinc
        filtered_stderr = "\n".join(
            line for line in stderr.splitlines()
            if not line.strip().lower().startswith("warning:")
        ).strip()

        return {
            "error": "❌ Error al ejecutar MiniZinc.",
            "detalles": {
                "stdout": stdout.strip() or "Sin salida",
                "stderr": filtered_stderr or "Sin errores explícitos",
                "codigo_retorno": returncode
            }
        }

    # ✅ Resultado exitoso
    try:
        lines = stdout.strip().splitlines()
        result = {"orden_escenas": [], "costo_total": 0, "detalles_por_actor": []}

        orden_match = re.search(r"Orden de escenas: \[(.*?)\]", stdout)
        if orden_match:
            result["orden_escenas"] = list(map(int, orden_match.group(1).split(",")))

        costo_total_match = re.search(r"Coste total: (\d+)", stdout)
        if costo_total_match:
            result["costo_total"] = int(costo_total_match.group(1))

        tiempo_compartido_match = re.search(r"Tiempo compartido.*?: (\d+)", stdout)
        if tiempo_compartido_match:
            result["tiempo_compartido_actores_evitar"] = int(tiempo_compartido_match.group(1))

        actor_pattern = re.compile(
            r"(\w+): Escenas \[(\d+)\.\.(\d+)\] Coste = (\d+), Tiempo en estudio = (\d+)"
        )
        for line in lines:
            match = actor_pattern.search(line)
            if match:
                result["detalles_por_actor"].append({
                    "nombre": f"Actor{match.group(1)}",
                    "rango_escenas_inicio": int(match.group(2)),
                    "rango_escenas_fin": int(match.group(3)),
                    "costo": int(match.group(4)),
                    "tiempo_en_estudio": int(match.group(5))
                })
        return result
    except Exception as e:
        return {"error": f"Error al parsear la salida de MiniZinc: {str(e)}"}


@app.post("/parte_1/")
async def parte_1(file: UploadFile = File(...)):
    return await process_file(file, MODEL_PATH_v1)


@app.post("/parte_2/")
async def parte_2(file: UploadFile = File(...)):
    return await process_file(file, MODEL_PATH_v2)


@app.get("/status")
async def status():
    processes = [{"task_id": tid, "pid": proc.pid} for tid, proc in active_tasks.items()]
    return {
        "activos": len(active_tasks),
        "libres": MAX_CONCURRENT_TASKS - len(active_tasks),
        "procesos": processes
    }


async def process_file(file: UploadFile, model_path: str):
    task_id = str(uuid.uuid4())
    print(f"\n📥 Nueva petición recibida (task_id={task_id})")

    if len(active_tasks) >= MAX_CONCURRENT_TASKS:
        oldest_task_id, oldest_process = next(iter(active_tasks.items()))
        print(f"🛑 Cancelando tarea antigua (task_id={oldest_task_id}, PID={oldest_process.pid})")
        kill_process(oldest_process)
        del active_tasks[oldest_task_id]
        print("✅ Tarea antigua cancelada.")

    log_status()

    async with semaphore:
        try:
            with NamedTemporaryFile(delete=False, suffix=".dzn") as temp_file:
                contents = await file.read()
                temp_file.write(contents)
                temp_file_path = temp_file.name

            # 🚀 Lanzar proceso y registrar inmediatamente
            process = run_minizinc(model_path, temp_file_path)
            if not process:
                return JSONResponse(status_code=500, content={"error": "No se pudo iniciar MiniZinc"})

            active_tasks[task_id] = process
            print(f"🚀 Proceso registrado (task_id={task_id}, PID={process.pid})")
            log_status()

            # 🔥 Esperar a que termine en segundo plano
            loop = asyncio.get_running_loop()
            stdout, stderr, returncode = await loop.run_in_executor(
                None, wait_for_process, process
            )
            parsed_result = parse_minizinc_output(stdout, stderr, returncode)
            os.remove(temp_file_path)
            return JSONResponse(content=parsed_result)

        except Exception as e:
            return JSONResponse(status_code=500, content={"error": str(e)})

        finally:
            active_tasks.pop(task_id, None)
            print(f"✅ Proceso terminado (task_id={task_id}, PID={process.pid})")
            log_status()
