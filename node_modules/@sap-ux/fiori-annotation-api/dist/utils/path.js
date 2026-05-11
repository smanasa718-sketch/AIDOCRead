"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathFromUri = pathFromUri;
const node_fs_1 = require("node:fs");
const node_url_1 = require("node:url");
const driveLetter = process.platform === 'win32' ? node_fs_1.realpathSync.native('\\')[0] : '';
/**
 *  Converts URI to path.
 *
 * @param uri - URI.
 * @returns File path.
 */
function pathFromUri(uri) {
    const parsedUri = (0, node_url_1.fileURLToPath)(uri);
    // for windows, some NodeJS methods will output uppercase drive letters, some in lowercase
    if (process.platform === 'win32') {
        return toggleCase(parsedUri.charAt(0)) + parsedUri.slice(1);
    }
    return parsedUri;
}
/**
 * Changes the drive letter to the same as `realpathSync`.
 *
 * @param character Drive letter character
 * @returns Normalized drive letter character
 */
function toggleCase(character) {
    return driveLetter === driveLetter.toUpperCase() ? character.toUpperCase() : character.toLowerCase();
}
//# sourceMappingURL=path.js.map