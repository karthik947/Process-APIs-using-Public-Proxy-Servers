const got = require('got');

const apiurl = 'https://api.binance.com/api/v3/ticker/24hr'; //weight = 40 => 30 req/min
const urlA = [...new Array(50)].map((u) => apiurl);

const procreq = async ({ url }) => {
  try {
    const res = await got(url);
    return {
      status: 'success',
      statusCode: res.statusCode,
    };
  } catch (err) {
    return { status: 'error', message: err + '' };
  }
};

const run = async () => {
  try {
    const results = await Promise.all(urlA.map((url) => procreq({ url })));
    console.table(results);
  } catch (err) {
    console.error(err);
  }
};

run();
