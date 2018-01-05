# Meteor server info

- A NPM version (derivative work) of [percolate:server-info]
- Rewritten in ES6 for Meteor 1.6+
- Without the AWS-specific and extra sections, not relevant for most usages.


## Usage

Once installed and configured, the package provides an information route 
available with HTTP Basic authentication, by default on `/serverInfo`, like the
following one:

![screenshot]


## Installation

- Like the original version, this project needs the MDG [Facts] package. So from the
project directory, type:
  ```bash
  meteor add facts
  ```
- Then install the package using NPM or Yarn. Since the project is not currently
  published on NPM, clone it locally to the project `imports`:
  ```bash
  cd imports
  git clone https://github.com/FGM/meteor_server_info.git meteor_server_info
  cd .. 
  meteor yarn add facts:@file:./imports/meteor_server_info
  ```
- Then, in the main JS file of the server part of the application, add code to
  initialize the package: 
    ```ecmascript 6
    import ServerInfo from "meteor_server_info";
    
    Meteor.startup(function () {
      const serverInfo = new ServerInfo(Meteor, WebApp, MongoInternals, Facts);
      serverInfo.register();
    });
    ```
- Edit the Meteor settings, at least to change the user and password.
- Run your application normally

## Configuration

The packages takes configuration from `Meteor.settings`, in which it uses the
following server keys:

- `path`: the path on which the information is made available. Defaults to 
  `/serverInfo`, unlike the original version which defaulted to `/info`.
- `user`: the user account for the HTTP Basic authentication securing access.
  Defaults to `insecure`.
- `pass`: the password for the user account. Defaults to `secureme`.

[percolate:server-info]: https://atmospherejs.com/percolate/server-info
[Facts]: https://atmospherejs.com/meteor/facts
[screenshot]: screenshot-todos.png


## License

As the original [percolate:server-info] package was licensed under the 
permissive MIT license, this derivative work has been relicensed under the
General Public License version 3 or later (SPDX: GPL-3.0+).  

## Changelog

* 1.0.1
  * added an explicit dev dependency on marked 0.3.9 to work around 
    https://github.com/jsdoc3/jsdoc/issues/1489 - can be removed once jsdoc
    updates its dependency to that level.
  * updated JsDoc to 3.5.5
  * fixed JsDoc configuration so that npm run doc actually works
* 1.0.0: initial version
