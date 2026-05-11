"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadModuleFromProjectSync = loadModuleFromProjectSync;
exports.normalizeModuleExport = normalizeModuleExport;
const project_access_1 = require("@sap-ux/project-access");
function getModulePathSync(projectRoot, moduleName) {
    if (!(0, project_access_1.getNodeModulesPath)(projectRoot, moduleName)) {
        throw Error('Path to module not found.');
    }
    return require.resolve(moduleName, { paths: [projectRoot] });
}
/**
 * Load module from project or app. Throws error if module is not installed.
 *
 * Note: Node's require.resolve() caches file access results in internal statCache, see:
 * (https://github.com/nodejs/node/blob/d150316a8ecad1a9c20615ae62fcaf4f8d060dcc/lib/internal/modules/cjs/loader.js#L155)
 * This means, if a module is not installed and require.resolve() is executed, it will never resolve, even after the
 * module is installed later on. To prevent filling cjs loader's statCache with entries for non existing files,
 * we check if the module exists using getNodeModulesPath() before require.resolve().
 *
 * @param projectRoot - root path of the project/app.
 * @param moduleName - name of the node module.
 * @returns - loaded module.
 */
function loadModuleFromProjectSync(projectRoot, moduleName) {
    try {
        const modulePath = getModulePathSync(projectRoot, moduleName);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require(modulePath);
        return normalizeModuleExport(module);
    }
    catch (error) {
        throw Error(`Module '${moduleName}' not installed in project '${projectRoot}'.\n${error.toString()}`);
    }
}
function normalizeModuleExport(module) {
    return 'default' in module ? module.default : module;
}
//# sourceMappingURL=moduleLoader.js.map