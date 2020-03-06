const core = require('@actions/core');
const fs = require('fs');
const req = require('request');

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
        var gameVersionsString = core.getInput('game_versions', { required: true });
        var stringList = gameVersionsString.split(',');
        var gameVersions = new Array();
        stringList.forEach(value, index, array => {
            if (value != null) {
                gameVersions[index] = parseInt(value)
            }
        });
        const releaseType = core.getInput('release_type', { required: true });
        if (!(releaseType == "alpha" || releaseType == "beta" || releaseType == "release")) {
            throw new Error("Invalid release type input! Use alpha, beta, or release!");
        }
        const relationsString = core.getInput('relations', { required: false });
        const projects = new Array();
        relationsString.split(',').forEach(value, index, array => {
            if (value != null) {
                const projectSplit = value.split(':');
                projects[index] = {
                    slug: projectSplit[0],
                    type: projectSplit[1]
                };
            }
        });
        var metadata = {
            changelog: changelog,
            gameVersions: gameVersions,
            releaesType: releaseType
        };
        if (changelogType != null) {
            metadata.changelogType = changelogType;
        }
        if (displayName != null) {
            metadata.displayName = displayName;
        }
        if (parentFileIDStr != null) {
            metadata.parentFileID = parseInt(parentFileIDStr);
        }
        if (relationsString != null) {
            metadata.relations = { projects: projects };
        }
        core.debug("Request meta:\n" + metadata);
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
                "metadata": metadata
            }
        }
        req.post(options, function(err, response, body) {
            if (!err) {
                core.debug("Response code: " + response.statusCode);
                core.setOutput(JSON.parse(body).id);
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