# CurseForge Uploader
An action for interacting with the [CurseForge file upload API](https://support.curseforge.com/en/support/solutions/articles/9000197321-curseforge-api)

# Usage/Arguments
See action.yml

## Example Workflow
[Here](https://github.com/itsmeow/curseforge-upload/blob/master/.github/workflows/test.yml) is an example workflow. It uploads test_jar.jar as "Test Jar" as an alpha build to [this project](https://minecraft.curseforge.com/projects/derpcats) with versions 1.12.2 and Java 8, a changelog simply stating "Test changelog message!" with a marked incompatibility with [this project](https://www.curseforge.com/minecraft/mc-mods/betteranimalsplus) and an optional dependency on [this project](https://www.curseforge.com/minecraft/mc-mods/claimit)

### Game Version IDs:
You can use numerical (effecient) IDs by making a request to and picking your versions

https://(endpoint).curseforge.com/api/game/versions?token=(your_token)

However, this is not always convenient. You can also use names/slugs from that link, for example: "1.12.2" and "Java 8" will be automatically parsed into the proper id. 

You may encounter issues with names/slugs that have multiple entries with different game version types. The minecraft endpoint has "1.12" 5 seperate times with different game version types for Bukkit, Minecraft 1.12, etc.
To fix this, you can prefix a game version with a type id or type id slug/name. For example "Minecraft 1.12:1.12" would get you ONLY the Minecraft 1.12 version and not the 4 others.

Another example is "java:Java 8". This filters to anything named "Java 8" with the type matching the slug/name "java". <br>
You can get a list of game version type IDs from this API: https://(endpoint).curseforge.com/api/game/version-types?token=(your token)

### Getting an API token
Obtain them here: https://authors.curseforge.com/account/api-tokens
