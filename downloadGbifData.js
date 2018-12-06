require('@babel/register');
const download = require('./bin/downloadGbifData').default;

download(process.argv.slice(2));
