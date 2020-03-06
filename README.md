# CurseForge Uploader
An action for interacting with the CurseForge file upload API https://authors.curseforge.com/knowledge-base/projects/529-api#project-upload

# Usage/Arguments
See action yml.

## Example Workflow
[Here](https://github.com/itsmeow/curseforge-upload/blob/master/.github/workflows/test.yml) is an example workflow. It uploads test_jar.jar as "Test Jar" as an alpha build to [this project](https://minecraft.curseforge.com/projects/derpcats) with versions 1.12.2 and Java 8, a changelog simply stating "Test changelog message!" with a marked incompatibility with [this project](https://www.curseforge.com/minecraft/mc-mods/betteranimalsplus) and an optional dependency on [this project](https://www.curseforge.com/minecraft/mc-mods/claimit)

### Game Version IDs:
You can get these by making a request to
https://(endpoint).curseforge.com/api/game/versions?token=(your_token)

### Getting an API token
Obtain them here: https://authors.curseforge.com/account/api-tokens