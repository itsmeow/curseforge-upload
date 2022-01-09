# CurseForge Uploader

An action for interacting with the [CurseForge file upload API](https://support.curseforge.com/en/support/solutions/articles/9000197321-curseforge-api)

## Usage/Arguments

| Name           | Description                                                                                                                                                                                                                                                                    | Default Value | Required |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | -------- |
| token          | Token used to authenticate with CurseForge API. Use a repository secret for this.                                                                                                                                                                                              | N/A           | ✅       |
| project_id     | Project id (numerical) to upload file to. You can get the numerical ID from the sidebar on a project page.                                                                                                                                                                     | N/A           | ✅       |
| game_endpoint  | The game subdomain of curseforge.com where the upload request will be made. (`minecraft`, `bukkit`, `kerbal`, etc.)                                                                                                                                                            | N/A           | ✅       |
| file_path      | The path to the file you want to upload.                                                                                                                                                                                                                                       | N/A           | ✅       |
| game_versions  | The game version IDs to select on this file. Separate IDs with commas. See README for more info.                                                                                                                                                                               | []            | ❌       |
| release_type   | The type of this release. Allowed values: `alpha`, `beta`, `release`.                                                                                                                                                                                                          | `release`     | ❌       |
| display_name   | The display name for this file.                                                                                                                                                                                                                                                | Filename      | ❌       |
| changelog      | The changelog text to put on the file.                                                                                                                                                                                                                                         |               | ❌       |
| changelog_type | The type of the changelog. Allowed values: `text`, `html` (aka. WYSIWYG), `markdown`.                                                                                                                                                                                          | `markdown`    | ❌       |
| relations      | List of projects this file is related to and their relation type. Separate with commas. Format: `projectslug:relationType` (slug is found in project URL) - Valid relationTypes are: `embeddedLibrary`, `incompatible`, `optionalDependency`, `requiredDependency`, and `tool` | []            | ❌       |
| parent_file_id | The id of the parent file to put this file under. (File IDs are integers, found in the URL)                                                                                                                                                                                    | None          | ❌       |

## Example Workflow

```yml
name: "Build Release"
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - { uses: actions/checkout@v2, with: { fetch-depth: 0 } }
      - {
          name: "Set up JDK 17",
          uses: actions/setup-java@v2,
          with: { distribution: "adopt", java-version: "17" },
        }
      - {
          name: "Build with Gradle",
          id: build,
          run: "chmod +x gradlew && ./gradlew build publish",
        }
      - name: "Upload to CurseForge"
        uses: itsmeow/curseforge-upload@v3
        with:
          file_path: "build/libs/examplemod-${{ steps.build.outputs.version }}.jar"
          game_endpoint: "minecraft"
          relations: "fabric-api:requiredDependency"
          game_versions: "Minecraft 1.18:1.18.1,Java 17,Fabric"
          project_id: "0"
          token: "${{ secrets.CF_API_TOKEN }}"
```

In this example, a file is uploaded with no custom title to project ID 0 in the Minecraft game category, with a dependency on Fabric API and game versions 1.18.1, Java 17, and Fabric loader.

The version in the filepath is not exported by default, so you can add this block to your buildscript to do so (this requires the Ubuntu runner):

```groovy
exec {
    commandLine "echo", "##[set-output name=version;]${project.version}";
}
```

## Getting an API token

Obtain them here: https://authors.curseforge.com/account/api-tokens

Add the token to your repository's secrets tab to use it, found under Settings.

## Game Version IDs Explained

You **MUST** namespace Minecraft version IDs as there are duplicates in the system for Bukkit.

You can use numerical IDs by making a request to and picking your versions from this API:

https://`endpoint`.curseforge.com/api/game/versions?token=`your_token`

Using this method is more efficient request wise, as otherwise the Action will have to search this API before requesting the upload.

However, this is not always convenient. You can also use names and slugs from that API, for example: "1.12.2" and "Java 8" will be automatically parsed into the proper id.

You may encounter issues with names/slugs that have multiple entries with different game version types. The minecraft endpoint has "1.12" 5 separate times with different game version types for Bukkit, Minecraft 1.12, etc.
To fix this, you can prefix a game version with a Type's ID, slug, or name. For example "Minecraft 1.12:1.12" would get you ONLY the Minecraft 1.12 version and not the 4 others.

Another example is "java:Java 8". This filters to anything named "Java 8" with the type matching the slug/name "java".

You can get a list of game version type IDs from this API:

https://`endpoint`.curseforge.com/api/game/version-types?token=`your_token`
