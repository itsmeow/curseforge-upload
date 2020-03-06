module.exports =
/******/ (function(modules, runtime) { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	__webpack_require__.ab = __dirname + "/";
/******/
/******/ 	// the startup function
/******/ 	function startup() {
/******/ 		// Load entry module and return exports
/******/ 		return __webpack_require__(982);
/******/ 	};
/******/
/******/ 	// run startup
/******/ 	return startup();
/******/ })
/************************************************************************/
/******/ ({

/***/ 1:
/***/ (function(module, __unusedexports, __webpack_require__) {

const core = __webpack_require__(266);
const fs = __webpack_require__(747);
const req = __webpack_require__(61);

async function getGameVersions(token, endpoint) {
    let gameVersionsString = core.getInput('game_versions', { required: true });
    let stringList = gameVersionsString.split(',');
    let gameVersions = [];
    let gameVersionNames = [];
    stringList.forEach(function(valStr, index, array) {
        if (valStr != null && valStr != "") {
            if(isID(valStr)) {
                gameVersions.push(parseInt(valStr));
            } else {
                gameVersionNames.push(valStr);
            }
        }
    });
    if(gameVersionNames.length > 0) {
        const options = {
            method: "GET",
            url: "https://" + endpoint + ".curseforge.com/api/game/versions",
            port: 443,
            headers: {
                "X-Api-Token": token
            }
        }
        core.debug("Converting game version names to IDs via CF API request");
        const versionData = JSON.parse(await requestPromise(options));
        const filteredVersions = versionData.filter(function(value, index, array) {
            return gameVersionNames.contains(value.name) || gameVersionNames.contains(value.slug);
        });
        filteredVersions.forEach(function(value, index, array) {
            gameVersions.push(value.id);
            core.debug("Converted " + value.slug + " to " + value.id);
        });
    }
    return gameVersions;
}

function requestPromise(options) {
    return new Promise(function (resolve, reject) {
        req(options, function (err, response, body) {
            if (!err) {
                if (response.statusCode == 200) {
                    resolve(body);
                } else {
                    reject(response.statusCode + ": " + response.statusMessage);
                }
            } else {
                reject(error);
            }
        });
    }).catch(error => core.setFailed(error.toString()));
}

function isID(str) {
    return !(isNaN(str) || str.indexOf(".") != -1)
}

async function run() {
    try {
        const token = core.getInput('token', { required: true });
        const projectId = core.getInput('project_id', { required: true });
        const endpoint = core.getInput('game_endpoint', { required: true });
        const filePath = core.getInput('file_path', { required: true });
        if (!fs.existsSync(filePath)) {
            throw new Error("Specified file does not exist!");
        }
        const changelog = core.getInput('changelog', { required: true });
        const changelogType = core.getInput('changelog_type', { required: false });
        const displayName = core.getInput('display_name', { required: false });
        const parentFileIDStr = core.getInput('parent_file_id', { required: false });
        const gameVersions = await getGameVersions(token, endpoint);
        const releaseType = core.getInput('release_type', { required: true });
        if (!(releaseType == "alpha" || releaseType == "beta" || releaseType == "release")) {
            throw new Error("Invalid release type input! Use alpha, beta, or release!");
        }
        const relationsString = core.getInput('relations', { required: false });
        const projects = [];
        relationsString.split(',').forEach(function(value, index, array) {
            if (value != null && value != "") {
                const projectSplit = value.split(':');
                projects[index] = {
                    slug: projectSplit[0],
                    type: projectSplit[1]
                };
            }
        });
        let metadata = {
            "changelog": changelog,
            "gameVersions": gameVersions,
            "releaseType": releaseType
        };
        if (changelogType != "") {
            metadata.changelogType = changelogType;
        }
        if (displayName != "") {
            metadata.displayName = displayName;
        }
        if (parentFileIDStr != "") {
            metadata.parentFileID = parseInt(parentFileIDStr);
        }
        if (relationsString != "") {
            metadata.relations = { projects: projects };
        }
        core.debug("Request meta: " + JSON.stringify(metadata));
        const options = {
            method: "POST",
            url: "https://" + endpoint + ".curseforge.com/api/projects/" + projectId + "/upload-file",
            port: 443,
            headers: {
                "Content-Type": "multipart/form-data",
                "X-Api-Token": token
            },
            formData: {
                "file": fs.createReadStream(filePath),
                "metadata": JSON.stringify(metadata)
            }
        }
        req.post(options, function(err, response, body) {
            if (!err) {
                core.debug("Response code: " + response.statusCode);
                if (response.statusCode == 200) {
                    core.debug(body.toString());
                    core.setOutput("id", JSON.parse(body).id.toString());
                } else {
                    core.setFailed(response.statusCode + ": " + response.statusMessage);
                }

            } else {
                core.setFailed(err);
            }
        });
    } catch (error) {
        core.setFailed(error.message);
        throw error;
    }
}

module.exports = run;

/***/ }),

/***/ 61:
/***/ (function() {

eval("require")("request");


/***/ }),

/***/ 266:
/***/ (function() {

eval("require")("@actions/core");


/***/ }),

/***/ 747:
/***/ (function(module) {

module.exports = require("fs");

/***/ }),

/***/ 982:
/***/ (function(__unusedmodule, __unusedexports, __webpack_require__) {

const run = __webpack_require__(1);

if (require.main === require.cache[eval('__filename')]) {
    run();
}

/***/ })

/******/ });