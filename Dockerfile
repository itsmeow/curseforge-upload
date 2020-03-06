FROM node:10.11.0-alpine

COPY ./src /action

ENTRYPOINT ["/action/entrypoint.sh"]

LABEL "com.github.actions.name"="Upload to CurseForge"
LABEL "com.github.actions.description"="Uploads files to CurseForge via CurseForge API"
LABEL "com.github.actions.icon"="package"
LABEL "com.github.actions.color"="gray-dark"
LABEL "repository"="https://github.com/itsmeow/curseforge-upload"
LABEL "homepage"="https://github.com/itsmeow/curseforge-upload"
LABEL "maintainer"="https://github.com/itsmeow"