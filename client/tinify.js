var tinify = require('tinify');
tinify.key = 'JYxkLSLTQdDJAkQbFydkroEKvj9ZOspr';

let file = '*';
if (process.argv.length >= 3) {
  file = process.argv[2];
}
console.log('file', file);

function tinifyFile(filePath) {
  console.log('compressing file - ' + filePath);
  tinify.fromFile(filePath).toFile(filePath, function(err) {
    if (err instanceof tinify.AccountError) {
      console.log('Account error: ' + err.message);
      // Verify your API key and account limit.
    } else if (err instanceof tinify.ClientError) {
      // Check your source image and request options.
      console.log('Client error: ' + err.message);
    } else if (err instanceof tinify.ServerError) {
      // Temporary issue with the Tinify API.
      console.log('Tinify Server error: ' + err.message);
    } else if (err instanceof tinify.ConnectionError) {
      // A network connection error occurred.
      console.log('Network Connection error: ' + err.message);
    } else if (err === null) {
      console.log('Successfully compressed image - ' + filePath);
    }
  });
}

if (file === '*') {
  const base = './bin/res/atlas/';
  tinifyFile(base + 'ui.png');
  tinifyFile(base + 'ui-loc.png');
  tinifyFile(base + 'game.png');
  tinifyFile(base + 'componenticon.png');
  tinifyFile(base + 'number.png');
  tinifyFile(base + 'loading.png');
} else {
  tinifyFile(file);
}
