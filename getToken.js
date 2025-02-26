const { google } = require('googleapis');
const http = require('http');
const url = require('url');

const CLIENT_ID = '82122316308-u1crfqtd2urnra0pbjqlgo8ij2lbdstb.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

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
    try {
      const server = http.createServer(async (req, res) => {
        try {
          const queryParams = url.parse(req.url, true).query;
          
          if (queryParams.code) {
            const { tokens } = await oauth2Client.getToken(queryParams.code);
            console.log('\n=================');
            console.log('Refresh Token:', tokens.refresh_token);
            console.log('=================\n');
            console.log('Save this refresh token in your configuration!');
            
            res.end('Authentication successful! You can close this window.');
            
            server.close();
            resolve(tokens);
          }
        } catch (error) {
          console.error('Error getting tokens:', error);
          res.end('Authentication failed! Please check console for errors.');
          reject(error);
        }
      }).listen(3000, () => {
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: scopes,
          prompt: 'consent'
        });

        console.log('1. Copy this URL and paste it in your browser:');
        console.log('\n', authUrl, '\n');
        console.log('2. Follow the Google authentication process');
        console.log('3. Wait for the refresh token to appear here');
      });

    } catch (error) {
      console.error('Server creation error:', error);
      reject(error);
    }
  });
}

getRefreshToken().catch(console.error);
