// TEC-15: developer runs keep their own data folder. The unpacked `electron .` takes its name, and with it its data
// folder, from package.json, which is the release app's: `npm run electron:developer` would otherwise read and write
// the player's real save. The packaged developer app is already named apart (electron-builder.developer.cjs); this
// gives the unpacked developer run that same folder. An explicit --user-data-dir (the smokes' temporary one) wins.
const path = require('node:path');

const DEVELOPER_APP_NAME = 'Blackline Survivor Dev';

/** The data folder a run must use instead of Electron's, or null to keep Electron's. */
function developerDataFolder({ developerBuild, appData, userDataSwitch }) {
  return developerBuild && !userDataSwitch ? path.join(appData, DEVELOPER_APP_NAME) : null;
}

module.exports = { DEVELOPER_APP_NAME, developerDataFolder };
