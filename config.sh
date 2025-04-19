#!/bin/bash

# Google Calendar MCP Configuration
export GOOGLE_CLIENT_ID=""
export GOOGLE_CLIENT_SECRET=""
export GOOGLE_REDIRECT_URI="http://localhost:3000/oauth2callback"

# Aquí debes agregar tu REFRESH_TOKEN después de obtenerlo
export GOOGLE_REFRESH_TOKEN=""

# Esta línea no es necesaria para la configuración, pero es útil para ejecutar el servidor
echo "Google Calendar MCP configuration loaded"
