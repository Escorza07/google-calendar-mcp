#!/bin/bash

# Cargar configuración
source ./config.sh

# Compilar TypeScript
npm run build

# Ejecutar el servidor
node build/index.js
