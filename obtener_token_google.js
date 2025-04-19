#!/usr/bin/env node
import { google } from 'googleapis';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer variables desde .env o desde entorno
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

async function getRefreshToken() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const parsedUrl = new URL(req.url, 'http://localhost:3000');
        const code = parsedUrl.searchParams.get('code');

        if (code) {
          const { tokens } = await oauth2Client.getToken(code);
          const refreshToken = tokens.refresh_token;

          if (!refreshToken) {
            console.error('\n❌ No se recibió refresh token.\nPuedes intentar revocar acceso desde tu cuenta de Google y volver a ejecutar este script.');
            res.end('No se recibió refresh token. Intenta de nuevo.');
            server.close();
            reject(new Error('No refresh token received'));
            return;
          }

          console.log('\n✅ REFRESH TOKEN OBTENIDO:');
          console.log(refreshToken);
          console.log('\n💡 Copia y guarda este token en un lugar seguro o agrégalo a tu archivo .env.\n');

          res.end('¡Autenticación exitosa! Puedes cerrar esta ventana.');
          server.close();
          resolve(refreshToken);
        } else {
          res.end('No se recibió código de autorización.');
        }
      } catch (err) {
        console.error('Error al procesar la solicitud:', err);
        res.end('Hubo un error. Revisa la consola.');
        server.close();
        reject(err);
      }
    });

    server.listen(3000, () => {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
      });

      console.log('\n🔐 AUTENTICACIÓN GOOGLE');
      console.log('1. Abre esta URL en tu navegador:\n');
      console.log(authUrl);
      console.log('\n2. Autoriza la app.');
      console.log('3. Espera a que se muestre tu refresh token en consola.\n');
    });
  });
}

// Ejecutar
getRefreshToken().catch(err => {
  console.error('❌ Error:', err);
});
