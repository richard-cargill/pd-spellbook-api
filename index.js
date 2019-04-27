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



function pluckContent(accu, current, index) {
  const {title, tags, content} = current;
  if(!title) return accu;
  return [...accu, {
    title: sanitizeHtml(title),
    tags: sanitizeHtml(tags).split(','),
    children: sanitizeHtml(content)}];
}

async function handler(req, res) {
  const rows = await getRows();

  const formattedResponse = rows.reduce(pluckContent, []);
  res.setHeader('Access-Control-Allow-Origin', '*');
  send(res, 200, formattedResponse);
}

module.exports = handler;
