#!/usr/bin/env node
import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Para obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de OAuth
const CLIENT_ID = '82122316308-u1crfqtd2urnra0pbjqlgo8ij2lbdstb.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Permisos necesarios
const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// Ruta al archivo de configuración de Claude
const claudeConfigPath = path.join(process.env.HOME, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');

async function getRefreshToken() {
  return new Promise((resolve, reject) => {
    try {
      console.log('Iniciando servidor local en el puerto 3000...');
      
      const server = http.createServer(async (req, res) => {
        try {
          const parsedUrl = new URL(req.url, 'http://localhost:3000');
          const queryParams = Object.fromEntries(parsedUrl.searchParams);
          
          if (queryParams.code) {
            console.log('Código de autorización recibido. Obteniendo tokens...');
            
            const { tokens } = await oauth2Client.getToken(queryParams.code);
            const refreshToken = tokens.refresh_token;
            
            if (!refreshToken) {
              console.error('No se recibió refresh token. Intenta revocar el acceso a la aplicación en tu cuenta de Google y vuelve a intentarlo.');
              res.end('No se recibió refresh token. Por favor, revoca el acceso a la aplicación en tu cuenta de Google y vuelve a intentarlo.');
              server.close();
              reject(new Error('No refresh token received'));
              return;
            }
            
            console.log('\n=================');
            console.log('Refresh Token:', refreshToken);
            console.log('=================\n');
            
            try {
              // Intentar actualizar el archivo de configuración de Claude
              if (fs.existsSync(claudeConfigPath)) {
                console.log(`Actualizando archivo de configuración en: ${claudeConfigPath}`);
                
                let configContent = fs.readFileSync(claudeConfigPath, 'utf8');
                
                // Verificar si el archivo es JSON válido
                try {
                  const config = JSON.parse(configContent);
                  
                  // Asegurarse de que existe la estructura mcpServers
                  if (!config.mcpServers) {
                    config.mcpServers = {};
                  }
                  
                  // Añadir o actualizar la configuración de Google Calendar
                  config.mcpServers['google-calendar'] = {
                    command: "node",
                    args: [
                      "/Users/gaelthome/Documents/Github/servidores-mcp/google-calendar-mcp/build/index.js"
                    ],
                    env: {
                      GOOGLE_CLIENT_ID: CLIENT_ID,
                      GOOGLE_CLIENT_SECRET: CLIENT_SECRET,
                      GOOGLE_REDIRECT_URI: REDIRECT_URI,
                      GOOGLE_REFRESH_TOKEN: refreshToken
                    },
                    disabled: false,
                    autoApprove: []
                  };
                  
                  // Guardar la configuración actualizada
                  fs.writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2), 'utf8');
                  console.log('Configuración actualizada correctamente.');
                  
                  res.end('¡Autenticación exitosa! La configuración de Claude ha sido actualizada. Puedes cerrar esta ventana y reiniciar la aplicación de Claude.');
                } catch (parseError) {
                  console.error('Error al analizar el archivo de configuración:', parseError);
                  console.log('No se pudo actualizar automáticamente. Por favor, actualiza manualmente el archivo de configuración.');
                  
                  res.end(`Autenticación exitosa, pero no se pudo actualizar automáticamente la configuración. 
                  Por favor, añade manualmente el siguiente servidor MCP a tu archivo de configuración de Claude:
                  
                  "google-calendar": {
                    "command": "node",
                    "args": [
                      "/Users/gaelthome/Documents/Github/servidores-mcp/google-calendar-mcp/build/index.js"
                    ],
                    "env": {
                      "GOOGLE_CLIENT_ID": "${CLIENT_ID}",
                      "GOOGLE_CLIENT_SECRET": "${CLIENT_SECRET}",
                      "GOOGLE_REDIRECT_URI": "${REDIRECT_URI}",
                      "GOOGLE_REFRESH_TOKEN": "${refreshToken}"
                    },
                    "disabled": false,
                    "autoApprove": []
                  }`);
                }
              } else {
                console.log(`No se encontró el archivo de configuración en: ${claudeConfigPath}`);
                console.log('Por favor, actualiza manualmente el archivo de configuración.');
                
                res.end(`Autenticación exitosa, pero no se encontró el archivo de configuración de Claude. 
                Por favor, añade manualmente el siguiente servidor MCP a tu archivo de configuración de Claude:
                
                "google-calendar": {
                  "command": "node",
                  "args": [
                    "/Users/gaelthome/Documents/Github/servidores-mcp/google-calendar-mcp/build/index.js"
                  ],
                  "env": {
                    "GOOGLE_CLIENT_ID": "${CLIENT_ID}",
                    "GOOGLE_CLIENT_SECRET": "${CLIENT_SECRET}",
                    "GOOGLE_REDIRECT_URI": "${REDIRECT_URI}",
                    "GOOGLE_REFRESH_TOKEN": "${refreshToken}"
                  },
                  "disabled": false,
                  "autoApprove": []
                }`);
              }
            } catch (fileError) {
              console.error('Error al manipular el archivo de configuración:', fileError);
              
              res.end(`Autenticación exitosa, pero hubo un error al actualizar la configuración. 
              Por favor, añade manualmente el siguiente servidor MCP a tu archivo de configuración de Claude:
              
              "google-calendar": {
                "command": "node",
                "args": [
                  "/Users/gaelthome/Documents/Github/servidores-mcp/google-calendar-mcp/build/index.js"
                ],
                "env": {
                  "GOOGLE_CLIENT_ID": "${CLIENT_ID}",
                  "GOOGLE_CLIENT_SECRET": "${CLIENT_SECRET}",
                  "GOOGLE_REDIRECT_URI": "${REDIRECT_URI}",
                  "GOOGLE_REFRESH_TOKEN": "${refreshToken}"
                },
                "disabled": false,
                "autoApprove": []
              }`);
            }
            
            server.close();
            resolve(tokens);
          } else {
            res.end('No se recibió código de autorización. Por favor, intenta de nuevo.');
          }
        } catch (error) {
          console.error('Error al procesar la solicitud:', error);
          res.end('Error de autenticación. Por favor, verifica la consola para más detalles.');
          server.close();
          reject(error);
        }
      }).listen(3000, () => {
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: scopes,
          prompt: 'consent'  // Forzar el diálogo de consentimiento para asegurar que recibimos un refresh token
        });

        console.log('\n=== INSTRUCCIONES ===');
        console.log('1. Copia esta URL y pégala en tu navegador:');
        console.log('\n', authUrl, '\n');
        console.log('2. Inicia sesión con tu cuenta de Google y autoriza el acceso');
        console.log('3. Espera a que se complete el proceso de autenticación');
        console.log('=====================\n');
      });

    } catch (error) {
      console.error('Error al iniciar el servidor:', error);
      reject(error);
    }
  });
}

// Ejecutar el proceso
console.log('Iniciando proceso de autenticación con Google Calendar...');
getRefreshToken()
  .then(() => {
    console.log('Proceso completado. Puedes cerrar esta ventana.');
  })
  .catch(error => {
    console.error('Error durante el proceso de autenticación:', error);
    console.log('Por favor, intenta de nuevo o configura manualmente el servidor MCP.');
  });
