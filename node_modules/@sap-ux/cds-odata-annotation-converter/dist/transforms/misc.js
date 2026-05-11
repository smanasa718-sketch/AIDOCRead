"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAbsoluteUriString = void 0;
const node_path_1 = require("node:path");
const node_url_1 = require("node:url");
const toAbsoluteUriString = (root, relativeUri) => {
    return (0, node_url_1.pathToFileURL)((0, node_path_1.join)(root, relativeUri)).toString();
};
exports.toAbsoluteUriString = toAbsoluteUriString;
//# sourceMappingURL=misc.js.map