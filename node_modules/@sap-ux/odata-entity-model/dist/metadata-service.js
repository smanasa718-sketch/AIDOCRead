"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataService = void 0;
/**
 * Extracts action/function name by removing the part enclosed in parentheses.
 *
 * @param name action/function name
 * @returns extracted name
 */
function getActionName(name) {
    const partsOpen = name.split('(');
    const partsClose = name.split(')');
    return partsOpen.length > 1 && partsClose.length > 1 ? (partsOpen.shift() ?? '') + (partsClose.pop() ?? '') : name;
}
/**
 * Builds a lookup for metadata elements based on provided data.
 *
 * @param metadata - The map to store metadata elements, keyed by their paths.
 * @param actionNames - The map to store action names and associated overload paths.
 * @param namespaces - The set to store unique namespaces encountered during the process.
 * @param metadataElements - The array of metadata elements to process and build the lookup.
 */
function buildMetadataElementLookup(metadata, actionNames, namespaces, metadataElements) {
    for (const node of metadataElements) {
        const namespace = getNamespace(node.path);
        if (namespace) {
            namespaces.add(namespace);
        }
        if (node.name.includes('(')) {
            const actionName = getActionName(node.name);
            let overloadPaths = actionNames.get(actionName);
            if (!overloadPaths) {
                overloadPaths = new Set();
                actionNames.set(actionName, overloadPaths);
            }
            overloadPaths.add(node.name);
        }
        metadata.set(node.path, node);
        if (node.content) {
            buildMetadataElementLookup(metadata, actionNames, namespaces, node.content);
        }
    }
}
/**
 * Returns the namespace of an element identified by its path.
 *
 * @param path - Path of an element
 * @returns    - Namespace
 */
function getNamespace(path) {
    let namespace = '';
    const segments = path.split('/');
    const firstSegment = segments[0] === '' ? segments[1] : segments[0];
    if (firstSegment) {
        // segment name for overloads can be <fqFunctionName>(<fqNamePar1>, <fqNamePar2>)
        // each fqName can contain dots
        const beforeFirstBracket = firstSegment.split('(')[0];
        const parts = beforeFirstBracket.split('.');
        parts.pop();
        namespace = parts.join('.');
    }
    return namespace;
}
/**
 * Metadata service
 */
class MetadataService {
    serviceId = '';
    /**
     * Keeps all metadata based on service id and file level (for invalidation when file changes)
     */
    metadata = new Map().set('', new Map());
    /**
     * Keeps all namespaces based on file level (for invalidation when file changes)
     */
    namespaces = new Map().set('', new Set());
    /**
     * Mapping of action names to set of overloads on file level (for invalidation when file changes)
     */
    actionNames = new Map().set('', new Map());
    /**
     * Map of relative to absolute uri
     */
    uriMap;
    /**
     * Returns service metadata (for current service).
     *
     * @returns Metadata map
     */
    get serviceMetadata() {
        return this.metadata.get(this.serviceId) ?? new Map();
    }
    /**
     * Lookup metadata element by its path.
     *
     * @param path - need to exactly match path of metadata element (i.e. function/action segment needs to contain ())
     * @returns Metadata element if it exists for the given path.
     */
    lookup(path) {
        return this.serviceMetadata.get(path);
    }
    /**
     *
     * @param path element path
     * @returns element location
     */
    getMetadataElementLocationsInternal(path) {
        const locations = [];
        const elements = [];
        const mdElement = this.lookup(path);
        if (mdElement) {
            elements.push(mdElement);
        }
        else {
            // action/function name? find all action/function overloads
            const overloadPaths = this.actionNames.get(this.serviceId)?.get(path);
            if (overloadPaths) {
                for (const overloadPath of overloadPaths) {
                    const overloadElement = this.getMetadataElement(overloadPath);
                    if (overloadElement) {
                        elements.push(overloadElement);
                    }
                }
            }
        }
        // build locations
        for (const element of elements) {
            if (element.location) {
                locations.push(element.location);
            }
        }
        return locations;
    }
    /**
     * OData Version
     *   '2.0': OData 2.0
     *   '4.0': OData 4.0
     *   '': not specified (e.g. for metadata generated from CDS sources)
     */
    ODataVersion;
    /**
     * isCds
     *   true: metadata are generated based on CDS sources
     */
    isCds;
    /**
     * Metadata file URIs.
     */
    fileUris = new Map().set('', '');
    /**
     * Metadata file URI.
     *
     * @returns metadata file URI
     */
    get fileUri() {
        return this.fileUris.get(this.serviceId) ?? '';
    }
    /**
     * Sets the metadata file URI.
     *
     * @param uri - metadata file URI
     */
    set fileUri(uri) {
        this.fileUris.set(this.serviceId, uri);
    }
    /**
     * Create new metadata service instance.
     *
     * @param options metadata service instance option
     */
    constructor(options) {
        this.ODataVersion = options?.ODataVersion ?? '';
        this.isCds = options?.isCds !== undefined ? options.isCds : this.ODataVersion === '';
        this.uriMap = options?.uriMap ?? new Map();
    }
    /**
     * Set map of uris from relative to absolute.
     *
     * @param uriMap A map where keys are relative URIs and values are their corresponding absolute URIs.
     */
    setUriMap(uriMap) {
        this.uriMap = uriMap;
    }
    /**
     * Import metadata.
     *
     * @param rootNodes Metadata elements.
     * @param fileUri Metadata file URI.
     *
     * The metadata is cached and invalidated (on file change) based on file level
     */
    import(rootNodes, fileUri) {
        // build map of all metadata elements contained in file
        const metadataMap = new Map();
        const actionNameMap = new Map();
        const namespaceSet = new Set();
        buildMetadataElementLookup(metadataMap, actionNameMap, namespaceSet, rootNodes);
        this.fileUris = new Map().set('', fileUri);
        this.namespaces = new Map().set('', namespaceSet);
        this.actionNames = new Map().set('', actionNameMap);
        this.metadata = new Map().set('', metadataMap);
    }
    /**
     * Import metadata without clearing existing metadata for other services.
     *
     * @param rootNodes Metadata elements.
     * @param fileUri Metadata file URI.
     * @param serviceId Service identifier.
     *
     * The metadata is cached and invalidated (on file change) based on file level
     */
    importServiceMetadata(rootNodes, fileUri, serviceId) {
        // build map of all metadata elements contained in file
        const metadataMap = new Map();
        const actionNameMap = new Map();
        const namespaceSet = new Set();
        buildMetadataElementLookup(metadataMap, actionNameMap, namespaceSet, rootNodes);
        this.fileUris.set(serviceId, fileUri);
        this.namespaces.set(serviceId, namespaceSet);
        this.actionNames.set(serviceId, actionNameMap);
        this.metadata.set(serviceId, metadataMap);
    }
    /**
     * Traverses all metadata elements and calls the specified visitor function for each element.
     *
     * @param {MetadataElementVisitor} visitElement - A function that will be called for each metadata element during traversal.
     * The function should accept a single argument, which is the metadata element being visited.
     */
    visitMetadataElements(visitElement) {
        for (const [, element] of this.serviceMetadata.entries()) {
            visitElement(element);
        }
    }
    /**
     * Returns namespaces representing metadata.
     *
     * @returns set of namespaces
     */
    getNamespaces() {
        return new Set(this.namespaces.get(this.serviceId) ?? []);
    }
    /**
     * Returns all metadata root elements.
     *
     * @returns a map containing metadata root elements, where the keys are the paths and the values are the corresponding metadata elements.
     */
    getRootMetadataElements() {
        const map = new Map();
        for (const metadataElement of this.serviceMetadata.values()) {
            if (metadataElement.path.indexOf('/') < 0) {
                map.set(metadataElement.path, metadataElement);
            }
        }
        return map;
    }
    /**
     * Returns a specific metadata element specified by its path.
     *
     * @param path Path identifying the metadata element (conforming to EDMX, i.e. function/action segments can also be without ())
     * @returns Metadata element
     */
    getMetadataElement(path) {
        const element = this.lookup(path);
        if (element) {
            return element;
        }
        // check if first segment represents action function name (without signature)
        const segments = path.split('/');
        const topLevelName = segments.shift();
        if (!topLevelName) {
            return undefined;
        }
        const actionFunctionOverloads = this.getActionFunctionOverloads(topLevelName);
        if (actionFunctionOverloads) {
            const remainingSegments = segments.join('/');
            for (const overloadName of actionFunctionOverloads) {
                const newPath = overloadName + (remainingSegments ? '/' + remainingSegments : '');
                const element = this.lookup(newPath);
                if (element) {
                    return element;
                }
            }
        }
        return undefined;
    }
    /**
     * Get Action or Function overloads by their top level name.
     *
     * @param topLevelName First segment represents action function name.
     * @returns if first segment represents action function name (without signature).
     */
    getActionFunctionOverloads(topLevelName) {
        return this.actionNames.get(this.serviceId)?.get(topLevelName);
    }
    /**
     * Get OData target kinds for a metadata element.
     *
     * @param path Path identifying metadata element.
     * @returns OData target kinds.
     */
    getEdmTargetKinds(path) {
        const element = this.getMetadataElement(path);
        if (!element) {
            return [];
        }
        return element.targetKinds;
    }
    /**
     * Get (LSP) Locations of metadata element.
     *
     * @param path - path identifying metadata element
     * @returns Locations for the metadata element
     */
    getMetadataElementLocations(path) {
        const result = this.getMetadataElementLocationsInternal(path);
        if (this.uriMap) {
            // map locations of result to external uri
            result.forEach((location) => {
                if (location.uri.indexOf('node_modules') > -1) {
                    const values = [...this.uriMap.values()];
                    const item = values.find((val) => val.endsWith(location.uri.replace(/\\/g, '/')));
                    if (item) {
                        location.uri = item;
                    }
                }
                else {
                    location.uri = this.uriMap.get(location.uri) ?? location.uri;
                }
            });
        }
        return result;
    }
    /**
     * Set the current service to be used.
     *
     * Note: This method sets the current service context for the MetadataService instance.
     * Subsequent calls to methods that depend on the service context will operate
     * on the metadata associated with the specified serviceId.
     * Should be called before invoking such methods to ensure correct behavior.
     * Recommended to use it in the following way:
     * {
     *   using mdService = metadataService.useService(serviceId);
     *   // Specific service context starts here
     *   mdService.getMetadataElement(...);
     * }
     * // Specific service context ends here
     *
     * In that case service context is reset to the main service after leaving the using block (dispose method is called automatically).
     *
     * @param serviceId - service identifier
     * @returns The current instance of MetadataService with the updated service context.
     */
    useService(serviceId) {
        this.serviceId = serviceId ?? '';
        return this;
    }
    /**
     * Resets the current service context to the default main service.
     */
    [Symbol.dispose]() {
        this.serviceId = '';
    }
    /**
     * Returns namespace's service key
     *
     * @param namespace - namespace name
     * @returns namespace's service key
     */
    getServiceKeyByNamespace(namespace) {
        if (!namespace) {
            return '';
        }
        let result = '';
        for (const [serviceKey, namespaces] of this.namespaces.entries()) {
            if (namespaces.has(namespace)) {
                result = serviceKey;
                break;
            }
        }
        return result;
    }
    /**
     * @returns service id list
     */
    getServiceIds() {
        return Array.from(this.metadata.keys());
    }
}
exports.MetadataService = MetadataService;
//# sourceMappingURL=metadata-service.js.map