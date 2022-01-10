# Mailman Scoreg
This Software manages mailman mailing lists via data optained from "ScoReg".
Members are added to mailing lists according to their MemberJobs in scoreg,
using regular expressions defined in setting.js.

All subscriptions are stored via sqlit in members.db and only changes are
applied to mailman.

## Usage
Must be run by an user which has the permission to use the mailman command line
interface. This is usually achieved by adding the user to the "list" group.
    node app.js [-v]

## Installation
* Rename settings.default.js to settings.js and configure scoreg credentials
### Prerequirements
* Node.JS
* mailman

### Configuration
The top section of settings.js contains a list of regular expressions which
are used to match MemberJobs to the apropriate mailing lists.
By default lists "biber", "wiwoe", "gust", "caex" and "raro" are defined.

The bottom section contains the credentials used to connect to scoreg.
