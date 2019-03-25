import * as fs from 'fs';
import { ShutterstockClient } from '../src/shutterstock-client';
const SESSION_ID = '<SESSION_ID>';

const charlesHttp = {
  proxy: 'http://localhost:8888',
  ca: fs.readFileSync('./charles.cer'),
  requestCert: true,
  rejectUnauthorized: false,
  strictSSL: false,
};

test.skip('isAuthenticated should return false if cookies expired', async () => {
  const client = new ShutterstockClient('', charlesHttp);
  expect(await client.isAuthenticated()).toBeFalsy();
}, 0);

test.skip('isAuthenticated should return true with valid session', async () => {
  const client = new ShutterstockClient(SESSION_ID, charlesHttp);
  expect(await client.isAuthenticated()).toBeTruthy();
}, 0);
