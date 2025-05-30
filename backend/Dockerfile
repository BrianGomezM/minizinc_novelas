# Imagen base
FROM python:3.10-slim

# Instala dependencias del sistema y MiniZinc, agregando libgl1-mesa-glx
RUN apt-get update && apt-get install -y \
    wget unzip build-essential libgomp1 libgl1-mesa-glx libegl1-mesa libx11-6 \
    && rm -rf /var/lib/apt/lists/*



# Instala MiniZinc
RUN wget https://github.com/MiniZinc/MiniZincIDE/releases/download/2.8.7/MiniZincIDE-2.8.7-bundle-linux-x86_64.tgz -O /tmp/mzn.tgz && \
    tar -xvzf /tmp/mzn.tgz -C /opt/ && \
    rm /tmp/mzn.tgz && \
    ln -s /opt/MiniZincIDE-2.8.7-bundle-linux-x86_64/bin/minizinc /usr/local/bin/minizinc

# Define directorio de trabajo
WORKDIR /app

# Copia el código
COPY . /app

# Instala dependencias de Python
RUN pip install --upgrade pip && pip install -r requirements.txt

# Exponer puerto
EXPOSE 8000

# Comando para iniciar FastAPI con uvicorn
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT}", "--solvers"
#Saber que solver tiene instalados 
#CMD ["minizinc", "--solvers"]


