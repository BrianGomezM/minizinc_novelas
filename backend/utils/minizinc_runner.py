import subprocess
import os

def run_minizinc(model_path: str, data_path: str) -> str:
    try:
        # Asegurarse de que las rutas son absolutas
        model_path = os.path.abspath(model_path)
        data_path = os.path.abspath(data_path)

        print(f"Ejecutando MiniZinc con el modelo: {model_path} y los datos: {data_path}")
        
        result = subprocess.run(
            ["minizinc", model_path, data_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            text=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        # Devolver errores estándar detallados
        return f"Error al ejecutar MiniZinc:\nSTDOUT: {e.stdout}\nSTDERR: {e.stderr}"
    except Exception as ex:
        # Capturar cualquier otro error
        return f"Error desconocido: {str(ex)}"
