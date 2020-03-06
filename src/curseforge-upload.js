const core = require('@actions/core');
const fs = require('fs');
const req = require('request');

async function run() {
    try {
        var i = 0
        const token = core.getInput('token', { required: true });
        console.log(i++); // 1
        const projectId = core.getInput('project_id', { required: true });
        console.log(i++); // 2
        const endpoint = core.getInput('game_endpoint', { required: true });
        console.log(i++); // 3
        const filePath = core.getInput('file_path', { required: true });
        console.log(i++); // 4
        if (!fs.existsSync(filePath)) {
            throw new Error("Specified file does not exist!");
        }
        console.log(i++); // 5
        const changelog = core.getInput('changelog', { required: true });
        console.log(i++); // 6
        const changelogType = core.getInput('changelog_type', { required: false });
        console.log(i++); // 7
        const displayName = core.getInput('display_name', { required: false });
        console.log(i++); // 8
        const parentFileIDStr = core.getInput('parent_file_id', { required: false });
        console.log(i++); // 9
        var gameVersionsString = core.getInput('game_versions', { required: true });
        console.log(i++); // 10
        var stringList = gameVersionsString.split(',');
        console.log(i++); // 11
        var gameVersions = new Array();
        console.log(i++); // 12
        stringList.forEach(value, index, array => gameVersions[index] = parseInt(value));
        console.log(i++); // 13
        const releaseType = core.getInput('release_type', { required: true });
        console.log(i++); // 14
        if (!(releaseType == "alpha" || releaseType == "beta" || releaseType == "release")) {
            throw new Error("Invalid release type input! Use alpha, beta, or release!");
        }
        console.log(i++); // 15
        const relationsString = core.getInput('relations', { required: false });
        console.log(i++); // 16
        const projects = new Array();
        console.log(i++); //17
        relationsString.split(',').forEach(value, index, array => {
            if (value != null) {
                const projectSplit = value.split(':');
                projects[index] = {
                    slug: projectSplit[0],
                    type: projectSplit[1]
                };
            }
        });
        console.log(i++); // 18
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
        console.log("Request meta:\n" + metadata);
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
                console.log("Response code: " + response.statusCode);
                core.setOutput(JSON.parse(body).id);
            } else {
                core.setFailed(err);
            }
        });
    } catch (error) {
        core.setFailed(error.message);
    }
}

module.exports = run;