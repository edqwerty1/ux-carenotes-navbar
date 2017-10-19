const path = require("path"),
    fs = require("fs"),
    uncss = require("uncss"),
    CleanCSS = require("clean-css"),
    merge = require("lodash.merge");

const isWin = /^win/.test(process.platform);

function formatBytes(bytes, decimals) {
    if (bytes == 0) return "0 Bytes";
    var k = 1024,
        dm = decimals || 2,
        sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function percentageSaved(originalSize, minifiedSize) {
    return Math.floor(((originalSize - minifiedSize) / (originalSize)) * 100) + "%";
}

// see https://github.com/giakki/uncss/wiki/Using-uncss-with-Bootstrap
const ignore = [
    /\.affix/,
    /\.alert/,
    /\.close/,
    /\.collaps/,
    /\.fade/,
    /\.has/,
    /\.help/,
    /\.in/,
    /\.modal/,
    /\.open/,
    /\.popover/,
    /\.tooltip/,
    /\.hide/
];

const cssFilename = "styles.css";
const htmlFile = "index.html";
const contents = fs.readFileSync(htmlFile);

const cssFile = path.join("css/", cssFilename);
const stats = fs.statSync(cssFile);
const cssFileSize = stats.size;

new Promise(function (resolve, reject) {
    uncss(path.join(htmlFile), {
        htmlroot: path.join("."),
        ignore: ignore,
        report: true
    }, function (error, output) {
        if (error) {
            reject(error);
        } else {
            resolve(output);
        }
    });
}).then(function (uncssContents) {
    return new CleanCSS({
            returnPromise: true
        })
        .minify(uncssContents);
}).then(function (cleanedCss) {
    if (cleanedCss.errors.length > 0) {
        console.error(cleanedCss.errors);
    } else {
        if (cleanedCss.warnings.length > 0) {
            console.warn(cleanedCss.warnings);
        }

        fs.renameSync(cssFile, cssFile + ".orig");
        fs.writeFileSync(cssFile, cleanedCss.styles, "utf8");

        const stat = merge(cleanedCss.stats, {
            cssFilename: cssFilename,
            cssFileSize: cssFileSize
        });

        console.info("File: ", stat.cssFilename);
        console.info("Original size: ", formatBytes(stat.cssFileSize));
        console.info("Minified size: ", formatBytes(stat.minifiedSize));
        console.info("Saving: ", percentageSaved(stat.cssFileSize, stat.minifiedSize));
        console.info("");
    }
}).catch(function (error) {
    console.error(error);
});
