"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = compile;
exports.compileSync = compileSync;
exports.createCdsCompilerFacadeForRoot = createCdsCompilerFacadeForRoot;
exports.createCdsCompilerFacadeForRootSync = createCdsCompilerFacadeForRootSync;
exports.getModulePathSync = getModulePathSync;
exports.getCdsCompilerSync = getCdsCompilerSync;
exports.getCdsCompiler = getCdsCompiler;
exports.getCdsFiles = getCdsFiles;
exports.updateContentBasedOnReference = updateContentBasedOnReference;
exports.clearGlobalCdsPathCache = clearGlobalCdsPathCache;
const fs_1 = require("fs");
const path_1 = require("path");
const child_process_1 = require("child_process");
const url_1 = require("url");
const project_access_1 = require("@sap-ux/project-access");
const facade_1 = require("./facade");
const path_2 = require("./path");
const moduleLoader_1 = require("./moduleLoader");
function prepareForCompile(root, cds, home) {
    const env = cds.env.for('cds', root);
    const moduleLookupDirectories = env.cdsc?.moduleLookupDirectories ?? ['node_modules/'];
    const options = {
        fallbackParser: 'cds',
        attachValidNames: true,
        cdsHome: home,
        attachTokens: true,
        smart: {},
        messages: [],
        moduleLookupDirectories,
        ...env.cdsc
    };
    return {
        options,
        env
    };
}
function enhanceCompileModel(compileModel, cdsCompiler) {
    compileModel.compiler = {
        getArtifactName: cdsCompiler.$lsp.getArtifactName,
        toCsn: () => cdsCompiler.$lsp.xsnToCsn(compileModel)
    };
}
function extractModelFromError(error, compiler) {
    // compiler throws if there are syntax errors, but still attaches model which is sufficient for our use case
    if (!compiler || !(error instanceof compiler.CompilationError)) {
        throw error;
    }
    const { model } = error;
    enhanceCompileModel(model, compiler);
    return model;
}
async function compile(root, files, cache) {
    let compiler;
    let cds;
    try {
        const modules = await getCdsCompiler(root);
        ({ compiler, cds } = modules);
        const fileCache = [...(cache?.entries() || [])].reduce((acc, [uri, file]) => {
            const path = (0, path_2.pathFromUri)(uri);
            acc[path] = file;
            return acc;
        }, {});
        const { options } = prepareForCompile(root, cds, modules.home);
        const compileModel = await compiler.$lsp.compile(files, root, options, fileCache);
        enhanceCompileModel(compileModel, compiler);
        return [compileModel, cds];
    }
    catch (error) {
        return [extractModelFromError(error, compiler), cds];
    }
}
function resolveFiles(root, files, cds, env) {
    if (files.length > 0) {
        return files;
    }
    const paths = getCapCustomPaths(root, env);
    const roots = [(0, path_1.join)(root, paths.app), (0, path_1.join)(root, paths.srv), (0, path_1.join)(root, paths.db)];
    return cds.resolve(roots, {
        skipModelCache: true,
        root
    });
}
function compileSync(root, files, cache) {
    let compiler;
    let cds;
    try {
        const modules = getCdsCompilerSync(root);
        ({ compiler, cds } = modules);
        const { options, env } = prepareForCompile(root, cds, modules.home);
        const resolvedFiles = resolveFiles(root, files, cds, env);
        const compileModel = compiler.$lsp.compileSync(resolvedFiles, root, options, cache);
        enhanceCompileModel(compileModel, compiler);
        return [compileModel, cds];
    }
    catch (error) {
        return [extractModelFromError(error, compiler), cds];
    }
}
/**
 *
 * @param root Project root
 * @param files List of CDS model entrypoints
 * @param cache File content cache
 */
async function createCdsCompilerFacadeForRoot(root, files, cache) {
    const [model, cds] = await compile(root, files, cache);
    return (0, facade_1.createCdsCompilerFacade)(model, root, cds);
}
/**
 * Create CDS compiler facade for given project.
 *
 * @param root Project root
 * @param files List of CDS model entrypoints (if empty, all CDS files under roots are included)
 * @param cache File content cache
 */
function createCdsCompilerFacadeForRootSync(root, files, cache) {
    const [model, cds] = compileSync(root, files, cache);
    return (0, facade_1.createCdsCompilerFacade)(model, root, cds);
}
let globalCdsPathCache;
/**
 * Try to load global installation of @sap/cds, usually child of @sap/cds-dk.
 *
 * @returns - module @sap/cds from global installed @sap/cds-dk
 */
async function getGlobalCDSPath() {
    if (!globalCdsPathCache) {
        const globalCdsHomePath = await (0, project_access_1.getGlobalCdsHomePath)();
        if (!globalCdsHomePath) {
            throw Error('Can not find global installation of module @sap/cds, which should be part of @sap/cds-dk');
        }
        globalCdsPathCache = (0, path_1.normalize)(globalCdsHomePath);
    }
    return globalCdsPathCache;
}
function getModulePathSync(projectRoot, moduleName) {
    if (!(0, project_access_1.getNodeModulesPath)(projectRoot, moduleName)) {
        throw Error('Path to module not found.');
    }
    return require.resolve(moduleName, { paths: [projectRoot] });
}
function loadCdsModuleSync(projectRoot, searchRoot) {
    const cds = (0, moduleLoader_1.loadModuleFromProjectSync)(searchRoot, '@sap/cds');
    fixCdsGlobals(projectRoot, cds);
    return cds;
}
function loadCdsCompilerModuleSync(root) {
    return (0, moduleLoader_1.loadModuleFromProjectSync)(root, '@sap/cds-compiler');
}
/**
 * Try to load global installation of @sap/cds, usually child of @sap/cds-dk.
 *
 * @returns - module @sap/cds from global installed @sap/cds-dk
 */
function getGlobalCDSPathSync() {
    if (!globalCdsPathCache) {
        const versions = getCdsVersionInfoSync();
        if (!versions.home) {
            throw Error('Can not find global installation of module @sap/cds, which should be part of @sap/cds-dk');
        }
        globalCdsPathCache = (0, path_1.normalize)((0, path_1.join)(versions.home, '..', '..', '..'));
    }
    return globalCdsPathCache;
}
/**
 * Get cds information, which includes versions and also the home path of cds module.
 *
 * @param [cwd] - optional folder in which cds --version should be executed
 * @returns - result of call 'cds --version'
 */
function getCdsVersionInfoSync(cwd) {
    const cdsVersionInfo = (0, child_process_1.spawnSync)('cds', ['--version'], { cwd, shell: true });
    const out = cdsVersionInfo.stdout.toString();
    if (out) {
        return extractCdsVersions(out);
    }
    else {
        throw new Error('Module path not found');
    }
}
function extractCdsVersions(output) {
    const versions = {};
    for (const line of output.split('\n').filter((v) => v)) {
        const [key, value] = line.split(': ');
        versions[key] = value;
    }
    return versions;
}
/**
 * Get a reference to the compiler module (@sap/cds-compiler) installed in the Fiori elements project.
 * @param root - project root, where the package.json is
 */
function getCdsCompilerSync(root) {
    try {
        // use project compiler
        const compiler = loadCdsCompilerModuleSync(root);
        const cds = loadCdsModuleSync(root, root);
        return { compiler, home: cds.home, cds };
    }
    catch (error) {
        try {
            const projectCdsDKRoot = (0, path_1.join)(root, 'node_modules', '@sap', 'cds-dk');
            // use project CDS DK if it exists otherwise use global
            const cdsDKRoot = (0, fs_1.existsSync)(projectCdsDKRoot) ? projectCdsDKRoot : getGlobalCDSPathSync();
            const compiler = loadCdsCompilerModuleSync(cdsDKRoot);
            const cds = loadCdsModuleSync(root, cdsDKRoot);
            return { compiler, home: cds.home, cds };
        }
        catch (error) {
            if (error.code !== 'MODULE_NOT_FOUND') {
                throw error;
            }
            const errorMessage = 'Could not find CDS modules';
            throw new Error(errorMessage);
        }
    }
}
async function loadCdsModule(projectRoot, searchRoot) {
    const module = await (0, project_access_1.loadModuleFromProject)(searchRoot, '@sap/cds');
    const cds = (0, moduleLoader_1.normalizeModuleExport)(module);
    fixCdsGlobals(projectRoot, cds);
    return cds;
}
async function loadCdsCompilerModule(root) {
    const module = await (0, project_access_1.loadModuleFromProject)(root, '@sap/cds-compiler');
    return (0, moduleLoader_1.normalizeModuleExport)(module);
}
/**
 * Get a reference to the compiler module (@sap/cds-compiler) installed in the Fiori elements project.
 * @param root - project root, where the package.json is
 */
async function getCdsCompiler(root) {
    try {
        // use project compiler
        const compiler = await loadCdsCompilerModule(root);
        const cds = await loadCdsModule(root, root);
        return { compiler, home: cds.home, cds };
    }
    catch (error) {
        try {
            const projectCdsDKRoot = (0, path_1.join)(root, 'node_modules', '@sap', 'cds-dk');
            // use project CDS DK if it exists otherwise use global
            const cdsDKRoot = (0, fs_1.existsSync)(projectCdsDKRoot) ? projectCdsDKRoot : await getGlobalCDSPath();
            const compiler = await loadCdsCompilerModule(cdsDKRoot);
            const cds = await loadCdsModule(root, cdsDKRoot);
            return { compiler, home: cds.home, cds };
        }
        catch (error) {
            if (error.code !== 'MODULE_NOT_FOUND') {
                throw error;
            }
            const errorMessage = 'Could not find CDS modules';
            throw new Error(errorMessage);
        }
    }
}
async function getCdsFiles(root, fileCache = new Map(), clearCache = false) {
    const { cds } = await getCdsCompiler(root);
    if (clearCache) {
        cds.resolve.cache = {};
    }
    // TODO: test if try catch is needed
    const env = cds.env.for('cds', root);
    const paths = getCapCustomPaths(root, env);
    const roots = [(0, path_1.join)(root, paths.app), (0, path_1.join)(root, paths.srv), (0, path_1.join)(root, paths.db)];
    const resolvedFiles = cds.resolve(roots, {
        skipModelCache: true,
        root
    });
    const files = mergeCachedFiles(roots, fileCache, resolvedFiles);
    const [model, cdsModule] = await compile(root, files, fileCache);
    const facade = (0, facade_1.createCdsCompilerFacade)(model, root, cdsModule);
    return facade.getFileSequence();
}
function mergeCachedFiles(roots, fileCache, resolvedFiles) {
    if (fileCache.size === 0) {
        return resolvedFiles;
    }
    const cachedFiles = [...fileCache.keys()];
    const files = new Set();
    // in case the root files only reside in memfs
    // imitate cds.resolve to include those
    for (const root of roots) {
        const rootWithoutTrailingSlash = root.endsWith(path_1.sep) ? root.slice(0, -path_1.sep.length) : root;
        const rootURL = (0, url_1.pathToFileURL)(rootWithoutTrailingSlash).toString();
        const newFiles = cachedFiles.filter((uri) => (0, path_1.dirname)((0, path_2.pathFromUri)(uri)) === (0, path_2.pathFromUri)(rootURL) && /\.(csn|cds)$/.test(uri));
        const existingFiles = resolvedFiles.filter((file) => (0, path_1.dirname)(file) === rootWithoutTrailingSlash);
        for (const file of newFiles.map(path_2.pathFromUri)) {
            files.add(file);
        }
        for (const file of existingFiles) {
            files.add(file);
        }
    }
    return [...files.values()];
}
/**
 *  Parse the current contents and check if the reference exists or not.
 *
 * @param root - path of the CDS project.
 * @param currentContent - The current content of the file.
 * @param reference - The reference (path to the document ../abc/testFile).
 *
 * @returns Updated content if the reference needs to be added, otherwise returns undefined.
 */
async function updateContentBasedOnReference(root, currentContent, reference) {
    const { cds } = await getCdsCompiler(root);
    const annotationFileUsingStatement = `using from '${reference}';\n`;
    if (currentContent === '') {
        return annotationFileUsingStatement;
    }
    const parsed = cds.parse(currentContent);
    if (!Array.isArray(parsed?.requires) || parsed.requires.find((ref) => ref === reference) === undefined) {
        const separatorFromCurrentContent = currentContent.endsWith('\n') ? '' : '\n';
        return `${currentContent}${separatorFromCurrentContent}${annotationFileUsingStatement}`;
    }
    return undefined;
}
function fixCdsGlobals(root, cds) {
    // Fix when switching cds versions dynamically
    if (global) {
        global.cds = cds;
    }
}
function getCapCustomPaths(root, env) {
    const paths = {
        app: 'app/',
        db: 'db/',
        srv: 'srv/'
    };
    if (env?.folders) {
        paths.app = env.folders.app;
        paths.srv = env.folders.srv;
        paths.db = env.folders.db;
    }
    return paths;
}
/**
 * Clears the cached global CDS path.
 *
 */
function clearGlobalCdsPathCache() {
    globalCdsPathCache = '';
}
//# sourceMappingURL=compile.js.map