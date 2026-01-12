const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'views', 'home.ejs');
const content = fs.readFileSync(filePath, 'utf8');

try {
    ejs.compile(content, { filename: filePath, async: false });
    console.log("Compilation successful!");
} catch (e) {
    console.error("Compilation failed:");
    console.error(e);
}
