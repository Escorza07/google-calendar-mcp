# Servidor MCP de Google Calendar para Claude

Este repositorio contiene un servidor MCP (Model Context Protocol) que permite a Claude interactuar con Google Calendar. Con este servidor, podrás pedirle a Claude que gestione tu calendario, cree eventos, actualice citas existentes, busque espacios libres y más.

## Funcionalidades

El servidor MCP de Google Calendar proporciona las siguientes herramientas:

- **list_events**: Listar eventos del calendario en un rango de tiempo específico
- **create_event**: Crear un nuevo evento en el calendario
- **update_event**: Actualizar un evento existente
- **delete_event**: Eliminar un evento
- **find_free_time**: Encontrar espacios disponibles en el calendario

## Requisitos previos

- Node.js instalado en tu sistema
- Una cuenta de Google con acceso a Google Calendar
- La aplicación de escritorio de Claude

## Instalación

### 1. Obtener el token de autenticación de Google

Para que Claude pueda acceder a tu calendario de Google, necesitas obtener un token de autenticación. Hemos creado un script que automatiza este proceso:

```bash
node obtener_token_google.js
```

Este script:
1. Abrirá un servidor local en el puerto 3000
2. Generará una URL que debes abrir en tu navegador
3. Te pedirá que inicies sesión en tu cuenta de Google y autorices el acceso
4. Obtendrá un token de actualización (refresh token)
5. Intentará actualizar automáticamente la configuración de Claude

Si el script no puede actualizar automáticamente la configuración, te proporcionará las instrucciones necesarias para hacerlo manualmente.

### 2. Verificar la instalación

Una vez completada la instalación:

1. Reinicia la aplicación de escritorio de Claude
2. Verifica que el servidor MCP de Google Calendar aparece en la lista de servidores conectados
3. Prueba la funcionalidad con comandos como:
   - "Muéstrame mis eventos para hoy"
   - "Crea una reunión mañana a las 10 AM"
   - "Encuentra espacios libres en mi calendario para esta semana"

## Solución de problemas

### El script no puede obtener un refresh token

Si el script no puede obtener un refresh token, asegúrate de:

1. Revocar el acceso a la aplicación en tu cuenta de Google:
   - Ve a [https://myaccount.google.com/permissions](https://myaccount.google.com/permissions)
   - Busca la aplicación "Google Calendar MCP" y revoca su acceso
   - Ejecuta el script nuevamente

2. Verificar que el puerto 3000 está disponible en tu sistema

### Error al actualizar la configuración de Claude

Si el script no puede actualizar automáticamente la configuración de Claude:

1. Abre el archivo de configuración de Claude manualmente:
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

2. Añade la configuración del servidor MCP de Google Calendar como se indica en las instrucciones proporcionadas por el script

3. Asegúrate de que el formato JSON es válido

## Ejemplos de uso

Una vez instalado, puedes pedirle a Claude que interactúe con tu calendario con comandos como:

- "Muéstrame mis próximas reuniones"
- "Crea un evento para mañana a las 3 PM titulado 'Reunión de equipo'"
- "Encuentra un espacio libre de 1 hora en mi calendario para esta semana"
- "Actualiza mi reunión del viernes para que empiece a las 10 AM en lugar de las 9 AM"
- "Elimina la reunión 'Revisión de proyecto' de mi calendario"

## Seguridad

Este servidor MCP utiliza OAuth 2.0 para autenticarse con Google, lo que significa que:

1. Claude nunca tiene acceso directo a tus credenciales de Google
2. Puedes revocar el acceso en cualquier momento desde tu cuenta de Google
3. El acceso está limitado solo a tu calendario, no a otros servicios de Google

## Desinstalación

Si deseas desinstalar el servidor MCP de Google Calendar:

1. Abre el archivo de configuración de Claude:
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

2. Elimina la sección correspondiente a "google-calendar"

3. Reinicia la aplicación de Claude

4. Opcionalmente, revoca el acceso en tu cuenta de Google:
   - Ve a [https://myaccount.google.com/permissions](https://myaccount.google.com/permissions)
   - Busca la aplicación "Google Calendar MCP" y revoca su acceso
