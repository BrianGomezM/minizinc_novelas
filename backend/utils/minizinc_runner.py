import subprocess
import os

def run_minizinc(model_path: str, data_path: str) -> str:
    try:
        model_path = os.path.abspath(model_path)
        data_path = os.path.abspath(data_path)
        result = subprocess.run(
            ["minizinc", "--solver", "org.gecode.gecode", model_path, data_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            text=True,
            timeout=30
        )

        return result.stdout
    except subprocess.TimeoutExpired:
        return "Error: ejecución de MiniZinc superó el tiempo límite de 30 segundos."
    except subprocess.CalledProcessError as e:
        return f"Error al ejecutar MiniZinc:\nSTDOUT: {e.stdout}\nSTDERR: {e.stderr}"
    except Exception as ex:
        return f"Error desconocido: {str(ex)}"
