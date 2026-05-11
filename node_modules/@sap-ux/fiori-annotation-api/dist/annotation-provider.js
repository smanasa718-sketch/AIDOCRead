"use strict";
/* eslint-disable @typescript-eslint/consistent-type-imports */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdsAnnotationProvider = void 0;
exports.getXmlServiceArtifacts = getXmlServiceArtifacts;
const odata_vocabularies_1 = require("@sap-ux/odata-vocabularies");
const xml_1 = require("./xml");
const odata_annotation_core_1 = require("@sap-ux/odata-annotation-core");
const vocabularies_1 = require("./vocabularies");
/**
 * Get XML service artifacts.
 *
 * @param odataVersion - Service OData version.
 * @param path - Service path.
 * @param metadataFile - Metadata file.
 * @param annotationFiles - Annotation files.
 * @param fileCache - File cache.
 * @returns Service artifacts.
 */
function getXmlServiceArtifacts(odataVersion, path, metadataFile, annotationFiles, fileCache) {
    const adapter = new xml_1.XMLAnnotationServiceAdapter({
        type: 'local-edmx',
        odataVersion: odataVersion,
        metadataFile,
        annotationFiles
    }, xml_1.XML_VOCABULARY_SERVICE, { apps: {}, projectType: 'EDMXBackend', root: '' }, '');
    adapter.sync(fileCache);
    const documents = adapter.getDocuments();
    const aliasInformation = getAliasInfo(adapter.metadataService, xml_1.XML_VOCABULARY_SERVICE, documents);
    return {
        path,
        metadataService: adapter.metadataService,
        annotationFiles: documents,
        aliasInfo: aliasInformation,
        fileSequence: adapter.getAllFiles().map((file) => file.uri)
    };
}
/**
 *
 */
class CdsAnnotationProvider {
    static serviceInfoCache = new Map();
    static serviceArtifactCache = new Map();
    static cdsCache = new Map();
    static vocabularyService = new odata_vocabularies_1.VocabularyService(true);
    /**
     * Get CDS service artifacts.
     *
     * @param rootPath - Project root path.
     * @param servicePath - Service path.
     * @param fileCache - File cache.
     * @returns Service artifacts or undefined.
     */
    static getCdsServiceArtifacts(rootPath, servicePath, fileCache) {
        // eslint-disable-next-line prefer-const
        let cachedArtifactsByRoot = this.serviceArtifactCache.get(rootPath);
        if (cachedArtifactsByRoot) {
            const cachedService = cachedArtifactsByRoot[servicePath];
            if (cachedService) {
                return cachedService;
            }
        }
        this.getFacade(rootPath, fileCache, false);
        // NOSONAR: Commented code kept for future CDS implementation reference
        // const services = this.serviceInfoCache.get(rootPath) ?? [];
        // const serviceInfo = services.find((s) => uniformUrl(s.urlPath) === uniformUrl(servicePath));
        // if (!serviceInfo) {
        //     return undefined;
        // }
        // const serviceName = serviceInfo.name;
        // const annotationFiles: Record<string, AnnotationFile> = {};
        // const metadataElementMap = facade.getMetadata(serviceName);
        // // We collect already full metadata from compile model, we don't need to build it based on paths.
        // const metadataCollector = createMetadataCollector(new Map(), facade);
        // const { propagationMap } = facade.getPropagatedTargetMap(serviceName);
        // for (const path of facade.getAllSourceUris()) {
        //     const uri = pathToFileURL(path).toString();
        //     const cdsAnnotationFile = toTargetMap(facade.blitzIndex.forUri(uri), uri, this.vocabularyService, facade);
        //     const annotationFile = toAnnotationFile(
        //         uri,
        //         this.vocabularyService,
        //         cdsAnnotationFile,
        //         metadataCollector,
        //         undefined,
        //         propagationMap,
        //         true
        //     ).file;
        //     annotationFiles[uri] = annotationFile;
        // }
        // const metadataElements = getMetadataElementsFromMap(metadataElementMap);
        // const metadataService = new MetadataService({ uriMap: facade?.getUriMap() || new Map() });
        // metadataService.import(metadataElements, 'DummyMetadataFileUri');
        // const aliasInformation = getAliasInfo(metadataService, XML_VOCABULARY_SERVICE, annotationFiles);
        // const url = uniformUrl(serviceInfo.urlPath);
        // const artifacts = {
        //     path: url,
        //     metadataService,
        //     annotationFiles,
        //     aliasInfo: aliasInformation,
        //     fileSequence: facade.getFileSequence().map((path) => pathToFileURL(path).toString())
        // };
        // cachedArtifactsByRoot = {};
        // cachedArtifactsByRoot[url] = artifacts;
        // this.serviceArtifactCache.set(rootPath, cachedArtifactsByRoot);
        // return artifacts;
    }
    /**
     * Get CDS services.
     *
     * @param rootPath - Project root path.
     * @param fileCache - File cache.
     * @returns Service info array.
     */
    static getServices(rootPath, fileCache) {
        this.getFacade(rootPath, fileCache, false);
        return this.serviceInfoCache.get(rootPath) ?? [];
    }
    /**
     * Reset CDS cache clearing compile model and service artifacts.
     *
     * @param rootPath - Project root path.
     * @param fileCache - File cache.
     */
    static resetCache(rootPath, fileCache) {
        this.serviceArtifactCache.delete(rootPath);
        this.getFacade(rootPath, fileCache, true);
    }
    static getFacade(rootPath, fileCache, _ignoreCache = false) {
        throw new Error('Not implemented yet.');
        // NOSONAR: Commented code kept for future CDS implementation reference
        // const cachedValue = this.cdsCache.get(rootPath);
        // if (cachedValue && ignoreCache === false) {
        //     return cachedValue;
        // }
        // console.log('compiling cds model for path:', rootPath);
        // performance.mark('cds-compile-start');
        // const cache = new Proxy(
        //     {},
        //     {
        //         get(compilerCache: Record<string, string | undefined>, path: string) {
        //             const cachedValue = compilerCache[path];
        //             if (cachedValue !== undefined) {
        //                 return cachedValue;
        //             }
        //             const uri = pathToFileURL(path).toString();
        //             const value = fileCache.get(uri);
        //             compilerCache[path] = value;
        //             return value;
        //         }
        //     }
        // );
        // const facade = createCdsCompilerFacadeForRootSync(rootPath, [], cache);
        // const services = processServices(facade.getServiceInfo());
        // this.serviceInfoCache.set(rootPath, services);
        // this.cdsCache.set(rootPath, facade);
        // performance.mark('cds-compile-end');
        // performance.measure('cds-compile', 'cds-compile-start', 'cds-compile-end');
        // console.log('CDS compilation performance:', performance.getEntriesByName('cds-compile'));
        // return facade;
    }
}
exports.CdsAnnotationProvider = CdsAnnotationProvider;
function getAliasInfo(metadataService, vocabularyService, files) {
    const aliasInformation = {};
    for (const [uri, document] of Object.entries(files)) {
        const namespaces = (0, odata_annotation_core_1.getAllNamespacesAndReferences)(document.namespace ?? { name: '', type: 'namespace' }, document.references);
        const aliasInfo = (0, odata_annotation_core_1.getAliasInformation)(namespaces, metadataService.getNamespaces());
        const aliasInfoWithAllVocabularies = (0, vocabularies_1.addAllVocabulariesToAliasInformation)(aliasInfo, vocabularyService.getVocabularies());
        aliasInformation[uri] = aliasInfoWithAllVocabularies;
    }
    return aliasInformation;
}
/**
 * Normalizes a URL by replacing backslashes with forward slashes and removing leading slashes.
 *
 * @param url - The URL to normalize.
 * @returns The normalized URL.
 */
// NOSONAR: Commented code kept for future CDS implementation reference
// function uniformUrl(url: string): string {
//     return url
//         .replaceAll(/\\/g, '/')
//         .replaceAll(/\/\//g, '/')
//         .replaceAll(/(?:^\/)/g, '');
// }
//# sourceMappingURL=annotation-provider.js.map