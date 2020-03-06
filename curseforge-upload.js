const core = require('@actions/core');
const fs = require('fs');
const req = require('request');

async function getGameVersions(token, endpoint) {
    let gameVersionsString = core.getInput('game_versions', { required: true });
    let stringList = gameVersionsString.split(',');
    let gameVersions = [];
    let gameVersionNames = {};
    stringList.forEach(function(valStr, index, array) {
        if (valStr != null && valStr != "") {
            if(isID(valStr)) {
                gameVersions.push(parseInt(valStr));
            } else {
                if(valStr.includes(':')) {
                    let valStrSp = valStr.split(':');
                    gameVersionNames[valStrSp[0]] = valStrSp[1];
                } else {
                    gameVersionNames[valStr] = "blank";
                }
            }
        }
    });
    if(Object.keys(gameVersionNames).length > 0) {
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

        const optionsTypes = {
            method: "GET",
            url: "https://" + endpoint + ".curseforge.com/api/game/version-types",
            port: 443,
            headers: {
                "X-Api-Token": token
            }
        }
        const versionTypeData = Object.values(gameVersionNames).filter((v,i,a) => v != "blank").length > 0 ? JSON.parse(await requestPromise(optionsTypes)) : [];

        const filteredVersions = versionData.filter(function(value, index, array) {
            let typeId = gameVersionNames.hasOwnProperty(value.name) ? gameVersionNames[value.name] : (gameVersionNames.hasOwnProperty(value.slug) ? gameVersionNames[value.slug] : "");
            if(typeId != null && typeId != "blank" && typeId != "") {
                if(isID(typeId)) {
                    return typeId == value.gameVersionTypeID;
                } else {
                    let result = versionTypeData.filter(function(v, i, a) {
                        return v.name == typeId || v.slug == typeId;
                    });
                    if(result.length != 1) {
                        core.setFailed("Cannot evaluate version type id " + typeId);
                    }
                    core.debug("Converted version type " + typeId + " to " + result[0].id)
                    return result[0].id == value.gameVersionTypeID;
                }
            }
            return typeId == "blank";
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
    return !(isNaN(str) || str.includes("."))
}

async function run() {
    try {
        const token = core.getInput('token', { required: true });
        const projectId = core.getInput('project_id', { required: true });
        const endpoint = core.getInput('game_endpoint', { required: true });
        const filePath = core.getInput('file_path', { required: true });
        if (!fs.existsSync(filePath)) {
            core.setFailed("Specified file at " + filePath + " does not exist!");
        }
        const changelog = core.getInput('changelog', { required: true });
        const changelogType = core.getInput('changelog_type', { required: false });
        const displayName = core.getInput('display_name', { required: false });
        const parentFileIDStr = core.getInput('parent_file_id', { required: false });
        const gameVersions = await getGameVersions(token, endpoint);
        const releaseType = core.getInput('release_type', { required: true });
        if (!(releaseType == "alpha" || releaseType == "beta" || releaseType == "release")) {
            core.setFailed("Invalid release type input! Use alpha, beta, or release!");
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

run();