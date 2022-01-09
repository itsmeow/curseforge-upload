const core = require("@actions/core");
const fs = require("fs");
const req = require("request");

async function getGameVersions(token, endpoint) {
  let gameVersionsString = core.getInput("game_versions", { required: false });
  let stringList = gameVersionsString.split(",");
  let gameVersions = [];
  let gameVersionNames = {};
  stringList.forEach((valStr) => {
    if (valStr != null && valStr != "") {
      if (isID(valStr)) {
        gameVersions.push(parseInt(valStr));
      } else {
        if (valStr.includes(":")) {
          let valStrSp = valStr.split(":");
          if (valStrSp.length != 2) {
            core.setFailed(
              "Invalid game version type id pair: " +
                valStr +
                " - Valid Format: typeid:versionid"
            );
          }
          gameVersionNames[valStrSp[1]] = valStrSp[0];
        } else {
          gameVersionNames[valStr] = "blank";
        }
      }
    }
  });
  if (Object.keys(gameVersionNames).length > 0) {
    const options = {
      method: "GET",
      url: "https://" + endpoint + ".curseforge.com/api/game/versions",
      port: 443,
      headers: {
        "X-Api-Token": token,
      },
    };
    core.debug("Converting game version names to IDs via CF API request");
    const versionData = JSON.parse(await requestPromise(options));

    const optionsTypes = {
      method: "GET",
      url: "https://" + endpoint + ".curseforge.com/api/game/version-types",
      port: 443,
      headers: {
        "X-Api-Token": token,
      },
    };
    const versionTypeData =
      Object.values(gameVersionNames).filter((v) => v != "blank").length > 0
        ? JSON.parse(await requestPromise(optionsTypes))
        : [];

    const filteredVersions = versionData.filter((v) => {
      let typeId = gameVersionNames.hasOwnProperty(v.name)
        ? gameVersionNames[v.name]
        : gameVersionNames.hasOwnProperty(v.slug)
        ? gameVersionNames[v.slug]
        : "";
      if (typeId != null && typeId != "blank" && typeId != "") {
        if (isID(typeId)) {
          return typeId == v.gameVersionTypeID;
        } else {
          let result = versionTypeData.filter(
            (v) => v.name == typeId || v.slug == typeId
          );
          if (result.length != 1) {
            core.setFailed("Cannot evaluate version type id " + typeId);
          }
          core.debug(
            "Converted version type " + typeId + " to " + result[0].id
          );
          return result[0].id == v.gameVersionTypeID;
        }
      }
      return typeId == "blank";
    });
    filteredVersions.forEach((v) => {
      gameVersions.push(v.id);
      core.debug("Converted " + v.slug + " to " + v.id);
    });
  }
  return gameVersions;
}

function requestPromise(options) {
  return new Promise((resolve, reject) => {
    req(options, (err, response, body) => {
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
  }).catch((error) => core.setFailed(error.toString()));
}

function isID(str) {
  return !(isNaN(str) || str.includes("."));
}

async function run() {
  try {
    const token = core.getInput("token", { required: true });
    const projectId = core.getInput("project_id", { required: true });
    if (!isID(projectId)) {
      core.setFailed("Invalid project ID! (Must be an integer)");
    }
    const endpoint = core.getInput("game_endpoint", { required: true });
    const filePath = core.getInput("file_path", { required: true });
    if (!fs.existsSync(filePath)) {
      core.setFailed("Specified file at " + filePath + " does not exist!");
    }
    const changelog = core.getInput("changelog", { required: false });
    const changelogType = core.getInput("changelog_type", { required: false });
    const displayName = core.getInput("display_name", { required: false });
    const parentFileIDStr = core.getInput("parent_file_id", {
      required: false,
    });
    if (!isID(parentFileIDStr)) {
      core.setFailed("Invalid parent file ID! (Must be an integer)");
    }
    const gameVersions = await getGameVersions(token, endpoint);
    const releaseType = core.getInput("release_type", { required: false });
    const relationsString = core.getInput("relations", { required: false });
    const projects = [];
    relationsString.split(",").forEach((v) => {
      if (v != null && v != "") {
        const projectSplit = v.split(":");
        projects[index] = {
          slug: projectSplit[0],
          type: projectSplit[1],
        };
      }
    });
    let metadata = {
      changelog: changelog || "",
    };
    if (gameVersions.length > 0) {
      metadata.gameVersions = gameVersions;
    }
    if (
      releaseType != "" &&
      releaseType != "alpha" &&
      releaseType != "beta" &&
      releaseType != "release"
    ) {
      core.setFailed(
        `Invalid release type: ${releaseType} (valid values: "alpha", "beta", "release")`
      );
    } else {
      metadata.releaseType = releaseType == "" ? "release" : releaseType;
    }
    if (
      changelogType != "" &&
      changelogType != "markdown" &&
      changelogType != "html" &&
      changelogType != "text"
    ) {
      core.setFailed(
        `Invalid changelog type: ${changelogType} (valid values: "markdown", "html", "text")`
      );
    } else {
      metadata.changelogType = changelogType || "markdown";
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
      url:
        "https://" +
        endpoint +
        ".curseforge.com/api/projects/" +
        projectId +
        "/upload-file",
      port: 443,
      headers: {
        "Content-Type": "multipart/form-data",
        "X-Api-Token": token,
      },
      formData: {
        file: fs.createReadStream(filePath),
        metadata: JSON.stringify(metadata),
      },
    };
    req.post(options, (err, response, body) => {
      if (!err) {
        core.debug("Response code: " + response.statusCode);
        if (response.statusCode == 200) {
          core.debug(`Response body:\n${response.body}`);
          core.setOutput("id", JSON.parse(body).id.toString());
        } else {
          core.setFailed(
            `${response.statusCode}: ${response.statusMessage}\nResponse body:\n${response.body}\nRequest body:${body}`
          );
        }
      } else {
        core.setFailed(
          `Request error:${err}\nResponse body:\n${response.body}\nRequest body:${body}`
        );
      }
    });
  } catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}

run();
