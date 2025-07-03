import subprocess
import os
import platform
import signal


def run_minizinc(model_path: str, data_path: str):
    """
    Lanza MiniZinc y devuelve el proceso activo (sin esperar a que termine).
    """
    try:
        model_path = os.path.abspath(model_path)
        data_path = os.path.abspath(data_path)

        # 🚀 Lanza el proceso
        process = subprocess.Popen(
            ["minizinc", "--solver", "org.minizinc.mip.highs", model_path, data_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        print(f"🚀 MiniZinc iniciado (PID={process.pid})")
        return process

    except Exception as ex:
        print(f"⚠️ Error al iniciar MiniZinc: {str(ex)}")
        return None


def wait_for_process(process, timeout=900):
    """
    Espera a que el proceso termine y devuelve (stdout, stderr, returncode).
    """
    try:
        stdout, stderr = process.communicate(timeout=timeout)
        was_cancelled = getattr(process, "_was_cancelled", False)
        if was_cancelled:
            return stdout, stderr, -999  # 🔥 Código especial para cancelado
        return stdout, stderr, process.returncode
    except subprocess.TimeoutExpired:
        kill_process(process)
        return "", "TimeoutExpired: proceso matado.", -1



def kill_process(process):
    """
    Mata un proceso dado y marca que fue cancelado.
    """
    try:
        if process and process.poll() is None:
            print(f"🔴 Matando proceso MiniZinc PID={process.pid}")
            process._was_cancelled = True  # 👈 Marca que lo cancelamos nosotros
            if platform.system() == "Windows":
                subprocess.run(["taskkill", "/F", "/PID", str(process.pid)])
            else:
                os.kill(process.pid, signal.SIGKILL)
    except Exception as e:
        print(f"⚠️ Error al matar proceso: {e}")

