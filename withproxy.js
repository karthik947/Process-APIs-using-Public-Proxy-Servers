const got = require('got');
const serversList = require('./servers');
const tunnel = require('tunnel');
let si = 0;

const apiurl = 'https://api.binance.com/api/v3/ticker/24hr'; //weight = 40 => 30 req/min
const urlA = [...new Array(50)].map((u) => apiurl);

const getHost = () => {
  si++;
  if (si === serversList.length) si = 0;
  const [host, port] = serversList[si].split(':');
  return { host, port };
};

const procreq = async ({ url }) => {
  try {
    const request = got(url, {
      agent: {
        https: tunnel.httpsOverHttp({
          proxy: getHost(),
        }),
      },
    });
    const p2 = new Promise((resolve, reject) => {
      setTimeout(() => {
        request.cancel();
        resolve('');
      }, 5 * 1000);
    });
    return await Promise.race([request, p2]);
  } catch (err) {
    throw err;
  }
};

const processWithRetry = async ({ url }) => {
  try {
    const ra = [...new Array(20)].map((r) => 1); //retry 20 times
    let apiresp;
    let retryAttempt = 0;
    const resp = await ra.reduce(async (previousPromise, nextID) => {
      try {
        const res = await previousPromise;
        if (!res?.body && !apiresp) {
          retryAttempt++;
          return procreq({ url });
        }
        if (res?.body) apiresp = res?.body;
        return Promise.resolve();
      } catch (err) {
        retryAttempt++;
        return procreq({ url });
      }
    }, Promise.resolve());
    return { retryAttempt, success: retryAttempt < 20 ? 'success' : 'error' };
  } catch (err) {
    console.log(err);
    return '';
  }
};

const tryall = async () => {
  try {
    const results = await Promise.all(
      urlA.map((url) => processWithRetry({ url }))
    );
    console.table(results);
  } catch (err) {
    console.log(err);
  }
};

tryall();
