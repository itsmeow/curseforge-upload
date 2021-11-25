# CurseForge Uploader
An action for interacting with the [CurseForge file upload API](https://support.curseforge.com/en/support/solutions/articles/9000197321-curseforge-api)

# Usage/Arguments
See action.yml

## Example Workflows
[Here](https://github.com/itsmeow/curseforge-upload/blob/master/.github/workflows/test.yml) is an example workflow. It uploads test_jar.jar as "Test Jar" as an alpha build to [this project](https://minecraft.curseforge.com/projects/derpcats) with versions 1.12.2 and Java 8, a changelog simply stating "Test changelog message!" with a marked incompatibility with [this project](https://www.curseforge.com/minecraft/mc-mods/betteranimalsplus) and an optional dependency on [this project](https://www.curseforge.com/minecraft/mc-mods/claimit)

### Example Full Workflow with Discord notification and auto changelog
The below example builds the jar and uploads it as an artefact to GitHub (only registered users can download this).
It also creates a label called latest. Which is accessable to download for everyone. We post this info with a webhook to Discord.
This will be done for each commit. If you want to create an official release continue reading.

If a commit starts with Release, followed by the version and release type (EXAMPLE: Release 0.2.7.3 alpha). This will do the following.
If you have a changelog.md in the root of your project and also formatted with a heading 2 for the title. The changelog feature will work if the correct commit syntax is used.
It will then release to CF with the changelog and version and type specified in the commit message. The changelog.md must have the version in the commit message, or it will break.

Do check this step: name: "CF upload" and reconfiure the inputs that it suites your mod! Please also change YOURUSERNAME YOURMOD accordingly for GitHub and CF!

Variables you need to set in the repo secrets:
WEBHOOK_ID
WEBHOOK_TOKEN
CF_API_TOKEN

Example of workflow output on discord: https://github.com/thedarkcolour/Future-MC/pull/276

<details>
  <summary>Click to expand!</summary>
  
```yaml
name: Autobuild for Minecraft Mod 1.12.2 Example

on: # Triggers the workflow on push events to only main
  push:
    branches:
      - main
  workflow_dispatch: # Allows you to run this workflow manually from the Actions tab

jobs: # Define build and release
  build:
    name: Build on ubuntu-latest
    runs-on: ubuntu-latest
    steps: # The purpose of this part is to build the file and include it as a build artifact on GitHub and notify trough Discord
      - name: Get repo files
        uses: actions/checkout@v2
      - name: Setup build env
        uses: actions/setup-java@v2
        with:
          distribution: 'temurin'
          java-version: '8'
          cache: 'gradle'
          java-package: jdk
          check-latest: true
      - name: Compile the best mod for Minecraft?
        run: ./gradlew build --no-daemon
      - name: Remove sources files and get specific jar # We never need the sources jar's and only grep what we want
        run: |
          find -type f -path './build/libs/*' -name '*sources*' -delete
          echo "CFILELOC=$(find ./build/libs/* | grep .jar | head -1)" >> $GITHUB_ENV
      - name: Upload to Github Artifacts tab
        uses: actions/upload-artifact@v2
        with:
          name: FutureMC # This is the name that will appear in the Artifacts tab
          path: "${{ env.CFILELOC }}"
      - name: Release public builds # This will make in GitHub a tag and include a changelog based on the commits and can include the compiled jar
        uses: "marvinpinto/action-automatic-releases@latest"
        with:
          repo_token: "${{ secrets.GITHUB_TOKEN }}"
          automatic_release_tag: "latest"
          prerelease: true
          draft: false
          files: "${{ env.CFILELOC }}"
      - name: Notify Discord channel # Sends commit message and url to latest tag
        uses: appleboy/discord-action@master
        with:
          webhook_id: ${{ secrets.WEBHOOK_ID }}
          webhook_token: ${{ secrets.WEBHOOK_TOKEN }}
          color: "#6a00ff"
          message: "New jar: https://github.com/YOURUSERNAME/YOURMOD/releases/tag/latest ${{ github.event.head_commit.message }}"
          #file: "${{ env.CFILELOC }}" It's to big :( 8MB is max
  release: # When a release is made, this part will be triggerd to make a release based on the commit: Release 0.2.7.3 alpha
    name: Create pubilc releases #                                                                    Trigger^ ^Version^Release type
    runs-on: ubuntu-latest
    needs: build
    if: "startsWith(github.event.head_commit.message, 'Release')" # Important! This checks if the commit starts with Release. Then we know when to start this second part
    steps: # Get repo files, compiled jar and create env vars from commit, changelog.md and compiled file loc to upload everything to CurseForge and let Discord server know
      - name: Get repo files
        uses: actions/checkout@v2
      - name: Get artifacts # Easier then just recompiling
        uses: actions/download-artifact@v2
        id: download # Needed to refer to ${{steps.download.outputs.download-path}}
        with:
          path: ./download # Needed so that finding artefacts is more reliable
      - name: Get needed env vars from commit and downloaded jar # Get version from second word, get release type from third word to env variables
        run: |
          echo "CFILELOC=$(find ${{steps.download.outputs.download-path}} | grep .jar | head -1)" >> $GITHUB_ENV
          echo "VERSION=$(echo ${{ github.event.commits[0].message }} | awk '{print $2}')" >> $GITHUB_ENV
          echo "RTYPE=$(echo ${{ github.event.commits[0].message }} | awk '{print $3}')" >> $GITHUB_ENV
      - name: Get changelog and place it into a env var for CF action
        run: | # This part will make a multi-lined env variable named CHANGELOG which uses EOF ending's to save the output of the awk command that only grabs the changelog of the given version from the commit
          echo 'CHANGELOG<<EOF' >> $GITHUB_ENV
          awk -v version='${{ env.VERSION }}' '/## Version / {printit = $3 == version}; printit;' 'changelog.md' | awk '!/^$/' >> $GITHUB_ENV
          echo 'EOF' >> $GITHUB_ENV
      - name: "CF upload"
        id: upload
        uses: itsmeow/curseforge-upload@v3
        with:
          changelog: "${{ env.CHANGELOG }}"
          changelog_type: markdown
          display_name: "Future MC 1.12.2 ${{ env.VERSION }}"
          file_path: "${{ env.CFILELOC }}" # ${{steps.download.outputs.download-path}}/*.jar See https://github.com/itsmeow/curseforge-upload/issues/7
          game_endpoint: minecraft
          game_versions: minecraft-1-12:1.12.2,2:Java 8,Forge
          relations: bwm-suite:optionalDependency,crafttweaker:optionalDependency,jei:optionalDependency,pams-harvestcraft:optionalDependency,quark:optionalDependency,tinkers-construct:optionalDependency,shadowfacts-forgelin:requiredDependency
          project_id: 1234567
          release_type: ${{ env.RTYPE}} # Must be release, beta or alpha
          token: "${{ secrets.CF_API_TOKEN }}"
      - name: "Build Success" # The final steps notify if the above upload worked out, so that we know when to debug CF/this workflow/the jar itself
        uses: appleboy/discord-action@master
        with:
          webhook_id: ${{ secrets.WEBHOOK_ID }}
          webhook_token: ${{ secrets.WEBHOOK_TOKEN }}
          color: "#1cfc03"
          message: New official release! Check it out @ https://www.curseforge.com/minecraft/mc-mods/YOURMOD/files/${{ steps.upload.outputs.id }} # Refers to the exact uploaded file on CF
      - name: "Build Fail"
        if: failure()
        uses: appleboy/discord-action@master
        with:
          webhook_id: ${{ secrets.WEBHOOK_ID }}
          webhook_token: ${{ secrets.WEBHOOK_TOKEN }}
          color: "#f20018"
          message: Error! It seems that something went wrong with uploading the above jar to Curseforge! Ping the admin to manually update to CF!
```
</details>


TODO: add this aswell: https://github.com/Macleykun/Future-MC/blob/patch-1/.github/workflows/pull_requests.yml

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
