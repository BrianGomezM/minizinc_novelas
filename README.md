# 🎭 minizinc_novelas – Planificación de Ensayos de Telenovela con MiniZinc, FastAPI y Next.js

Este proyecto busca resolver un problema clásico de programación por restricciones: la planificación eficiente de escenas en una telenovela para minimizar el costo total asociado al tiempo de los actores en el set. El modelo está desarrollado en **MiniZinc**, con una interfaz backend en **FastAPI** y frontend en **Next.js**.

---

## 📄 Información General

**Objetivo principal**: Encontrar un orden de ensayo óptimo para las escenas, considerando:
- Participación de actores por escena
- Costo por tiempo de cada actor
- Disponibilidad individual de actores
- Incompatibilidades entre actores (evitar coincidencias)
- Reducción de simetrías y restricciones adicionales para mejorar el modelo

---

## 👨‍💻 Autores

- **Brayan Gómez Muñoz** – 2310016  
- **Lenin Esteban Carabalí Moreno** - 2310025
- **Juan José Moreno Jaramillo** – 2310038 
- **Hector Luis Díaz Hurtado** - 2310001
- **Profesor**: Robinson Andrey Duque Agudelo  
- **Curso**: Programación por Restricciones  
- **Escuela**: Ingeniería de Sistemas y Computación  
- **Universidad del Valle**

---

## 🗂 Estructura del Proyecto

minizinc-novela/
│
├── backend/ # Lógica en FastAPI + ejecución de modelos MiniZinc
│ ├── main.py # API principal
│ ├── requirements.txt # Dependencias del backend
│ ├── models/ # Archivos .mzn (modelos MiniZinc)
│ ├── data/ # Archivos de entrada .dzn
│ └── utils/ # Scripts auxiliares (ej. ejecución desde Python)
│
├── frontend/                  # Interfaz en Next.js
│   ├── app/                   # Páginas principales (App Router)
│   ├── components/            # Componentes React
│   ├── public/                # Archivos estáticos
│   ├── styles/                # Estilos CSS
│   ├── package.json           # Dependencias del frontend
│   └── ...
│
├── .gitignore # Ignorar entornos virtuales, node_modules, etc.
├── README.md # Este archivo


---

## ⚙️ Instalación y Ejecución

### 🔧 Requisitos previos

- [MiniZinc](https://www.minizinc.org/) instalado y en el PATH del sistema
- Python 3.8 o superior
- Node.js (recomendado v18+)
- npm o yarn

---

### 🔙 Backend (FastAPI + MiniZinc)

1. Instala las dependencias:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
El backend se encargará de recibir archivos .dzn, ejecutar el modelo en MiniZinc y devolver la solución.


🖥️ Frontend (Next.js)
cd frontend
npm install # npm install --legacy-peer-deps si existe alguna falla
npm run dev

La interfaz web permite subir un archivo .dzn, ejecutarlo, y ver el resultado óptimo de planificación de escenas.


🧪 Ejemplo de Entrada (.dzn)
ACTORES = {Actor1, Actor2, Actor3, ...};
Escenas = [
  | 1, 1, 0, ..., 10  % Actor1 participa en escenas y tiene un costo de 10
  | 0, 1, 1, ..., 4   % Actor2, etc.
];

Duracion = [2, 1, 1, 3, ...];

Disponibilidad = [
  | Actor1, 0
  | Actor2, 15
];

Evitar = [
  | Actor1, Actor3
  | Actor2, Actor4
];

🧠 Sobre el modelo
Parámetros: Lista de actores, escenas, duración, costos, disponibilidad, restricciones entre actores.

Variables: Orden de las escenas, ventanas de permanencia en set por actor.

Restricciones:

Participación obligatoria por actor

Disponibilidad máxima

Mínima coincidencia con actores evitados

Función objetivo: Minimizar el costo total de presencia de actores en el set.

📝 Informe
El archivo ProyectoPPR.pdf incluye:

Análisis del problema

Modelado COP en MiniZinc

Estrategias de búsqueda

Resultados experimentales y conclusiones

📜 Licencia
