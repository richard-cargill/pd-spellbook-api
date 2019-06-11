const GoogleSpreadsheet = require('google-spreadsheet');
const {send} = require('micro');
const sanitizeHtml = require('sanitize-html');
const microCors = require('micro-cors');
const cors = microCors({});
const doc = new GoogleSpreadsheet('1FTrFBP-ss-R76XncyJv9znOJCAEMgrWqRfqAVaS5HNs');

const getRows = () => new Promise(function(resolve, reject) {
  doc.getInfo(function(err, info) {
    if(err) reject(err);

    resolve(info.worksheets[0]);
  });
}).then(function(sheet) {
  return new Promise(function(resolve, reject) {
    sheet.getRows({
      offset: 1,
      orderby: 'col2'
    }, function (err, rows) {
      if(err) reject(err);
      resolve(rows);
    });
  });
});

function sortByTitle(rows) {
  return [...rows.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();

    if(aTitle < bTitle) return -1;
    if(aTitle > bTitle) return 1;
    return 0;
  })];
}

function getFirstChar(string) {
  return string.toString().charAt(0).toLowerCase();
}

function formatResponse(rows) {
  const rowLength = rows.length;
  let terms = [];
  let letters = [];

  for(let i = 0; i < rowLength; i++) {
    const {title, tags, content} = rows[i];
    let position = null;

    if(!title) continue;

    const firstChar = getFirstChar(title);

    if(!~letters.indexOf(firstChar)) {
      letters = [...letters, firstChar];
      position = 'first';
    }

    terms = [...terms, {
        title: sanitizeHtml(title),
        tags: sanitizeHtml(tags).split(','),
        children: sanitizeHtml(content),
        position
      }
    ];
  }

  return {
    letters,
    terms
  };
}

async function handler(req, res) {
  const rows = await getRows();
  const rowsSortedByTitle = sortByTitle(rows);
  const response = formatResponse(rowsSortedByTitle);
  const minify = JSON.stringify;

  res.setHeader('Access-Control-Allow-Origin', '*');

  send(res, 200, minify(response));
}

module.exports = handler;
