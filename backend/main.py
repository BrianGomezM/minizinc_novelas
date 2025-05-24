import re

def parse_minizinc_output(output: str) -> dict:
    try:
        lines = output.strip().splitlines()
        result = {}

        # Orden de escenas
        orden_match = re.search(r"Orden de escenas: \[(.*?)\]", output)
        result["orden_escenas"] = list(map(int, orden_match.group(1).split(","))) if orden_match else []

        # Costo total
        costo_total_match = re.search(r"Costo total: (\d+)", output)
        result["costo_total"] = int(costo_total_match.group(1)) if costo_total_match else 0

        # Tiempo compartido actores a evitar
        tiempo_espera_match = re.search(r"Tiempo compartido actores a evitar: (\d+)", output)
        result["tiempo_compartido_actores_evitar"] = int(tiempo_espera_match.group(1)) if tiempo_espera_match else 0

        # Tiempos por actor
        actores = []
        actor_pattern = re.compile(
            r"Actor (\w+): (\d+)->(\d+) \((\d+)u, Costo: (\d+)\)"
        )
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
