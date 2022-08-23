#! /usr/bin/env node
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const yargs = require('yargs');

const exitWithError = (err) => {
  console.error(`
(!) ${err}
  `);
  process.exit(1);
}

const options = yargs
  .usage("Usage: -n <number> -p <password>")
  .option("n", { alias: "phone", describe: "Phone number, format 33000000000", type: "string", demandOption: true })
  .option("p", { alias: "password", describe: "Password", type: "string", demandOption: true })
  .option("d", { alias: "domain", describe: "Domain, www.lycamobile.fr by default", default: 'www.lycamobile.fr', type: "string" })
  .argv;

const session = fetch(`https://${options.domain}/wp-admin/admin-ajax.php`, {
  method: 'POST',
  credentials: 'include',
  redirect: 'follow',
  body: new URLSearchParams({
    action: 'lyca_login_ajax',
    method: 'login',
    mobile_no: options.phone,
    pass: options.password,
  }),
  headers: {
    Accept: 'application/json',
    Referer: `https://${options.domain}/en/bundles/`,
    Origin: `https://${options.domain}`,
    Cookie: 'wp-wpml_current_language=en;',
    'Accept-Language': 'en-us',
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

session.then(res => res.json()).then(data => {
  if(data.is_error === true) return Promise.reject(data.message || 'Unknown error');
}).catch(err => exitWithError(err));

const auth = session.then(res => {
  return res.headers.get('set-cookie');
});

const data = auth.then(cookie => fetch(`https://${options.domain}/en/my-account/`, {
    method: 'GET',
    headers: {
      Cookie: cookie,
      Referer: `https://${options.domain}/en/bundles/`,
      Origin: `https://${options.domain}`,
      'Accept-Language': 'en-us',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15',
    },
  }).then(res => res.text()).then(html => {
    const select = cheerio.load(html);
    const expiration = [];
    const expElements = [...select("p.bdl-balance > span").map((i, el) => select(el).text()
      .replace('| ', '').replace(/\s\s+/g, ' ')
    )];
    expElements.forEach((el, i) => {
      if (expElements[i] && expElements[i + 1] && i % 2 === 0) {
        const start = expElements[i].match(/\b\d{2}-\d{2}-\d{4}\b/) || [null]
        const end = expElements[i + 1].match(/\b\d{2}-\d{2}-\d{4}\b/) || [null]
        expiration.push({start: start[0], end: end[0]});
      }
    });
    const internet = [...select("div.bdl-mins").map((i, el) => {
      const element = select(el).text().replaceAll('\n', '');
      if (element !== 'U' && element !== 'Unlimited') return element;
    })];
    return {
      phone: select('.bdl-msisdn').text(),
      balance: select('span.myaccount-lowbalance').text()
        .replace('\nTopup', ''),
      expiration,
      internet,
    };
  })
);

data.then(res => {
  console.log(`
* Phone: ${res.phone}
* Money balance: ${res.balance}
* Internet balance: ${res.internet.join(', ')}
* Expiration: ${res.expiration.map((el) => `${el.start} — ${el.end}`).join(', ')}
  `)
});