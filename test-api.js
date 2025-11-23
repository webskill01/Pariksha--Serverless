import handler from './api/stats.js';

const req = {
  method: 'GET',
  query: {},
  headers: {}
};

const res = {
  setHeader: () => {},
  status: (code) => {
    console.log('Status:', code);
    return res;
  },
  json: (data) => {
    console.log('Response:', JSON.stringify(data, null, 2));
  },
  end: () => {
    console.log('Response ended');
  }
};

console.log('Testing /api/stats endpoint...');
handler(req, res).catch(console.error);
