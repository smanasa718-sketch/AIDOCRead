import type { TargetKind, Location, MetadataElement, Path, ODataVersionType, MetadataServiceOptions, MetadataElementVisitor, IMetadataService } from '@sap-ux/odata-annotation-core-types';
/**
 * Metadata service
 */
export declare class MetadataService implements IMetadataService {
    private serviceId;
    /**
     * Keeps all metadata based on service id and file level (for invalidation when file changes)
     */
    private metadata;
    /**
     * Keeps all namespaces based on file level (for invalidation when file changes)
     */
    private namespaces;
    /**
     * Mapping of action names to set of overloads on file level (for invalidation when file changes)
     */
    private actionNames;
    /**
     * Map of relative to absolute uri
     */
    private uriMap;
    /**
     * Returns service metadata (for current service).
     *
     * @returns Metadata map
     */
    private get serviceMetadata();
    /**
     * Lookup metadata element by its path.
     *
     * @param path - need to exactly match path of metadata element (i.e. function/action segment needs to contain ())
     * @returns Metadata element if it exists for the given path.
     */
    private lookup;
    /**
     *
     * @param path element path
     * @returns element location
     */
    private getMetadataElementLocationsInternal;
    /**
     * OData Version
     *   '2.0': OData 2.0
     *   '4.0': OData 4.0
     *   '': not specified (e.g. for metadata generated from CDS sources)
     */
    readonly ODataVersion: ODataVersionType | '';
    /**
     * isCds
     *   true: metadata are generated based on CDS sources
     */
    readonly isCds: boolean;
    /**
     * Metadata file URIs.
     */
    private fileUris;
    /**
     * Metadata file URI.
     *
     * @returns metadata file URI
     */
    get fileUri(): string;
    /**
     * Sets the metadata file URI.
     *
     * @param uri - metadata file URI
     */
    set fileUri(uri: string);
    /**
     * Create new metadata service instance.
     *
     * @param options metadata service instance option
     */
    constructor(options?: MetadataServiceOptions);
    /**
     * Set map of uris from relative to absolute.
     *
     * @param uriMap A map where keys are relative URIs and values are their corresponding absolute URIs.
     */
    setUriMap(uriMap: Map<string, string>): void;
    /**
     * Import metadata.
     *
     * @param rootNodes Metadata elements.
     * @param fileUri Metadata file URI.
     *
     * The metadata is cached and invalidated (on file change) based on file level
     */
    import(rootNodes: MetadataElement[], fileUri: string): void;
    /**
     * Import metadata without clearing existing metadata for other services.
     *
     * @param rootNodes Metadata elements.
     * @param fileUri Metadata file URI.
     * @param serviceId Service identifier.
     *
     * The metadata is cached and invalidated (on file change) based on file level
     */
    importServiceMetadata(rootNodes: MetadataElement[], fileUri: string, serviceId: string): void;
    /**
     * Traverses all metadata elements and calls the specified visitor function for each element.
     *
     * @param {MetadataElementVisitor} visitElement - A function that will be called for each metadata element during traversal.
     * The function should accept a single argument, which is the metadata element being visited.
     */
    visitMetadataElements(visitElement: MetadataElementVisitor): void;
    /**
     * Returns namespaces representing metadata.
     *
     * @returns set of namespaces
     */
    getNamespaces(): Set<string>;
    /**
     * Returns all metadata root elements.
     *
     * @returns a map containing metadata root elements, where the keys are the paths and the values are the corresponding metadata elements.
     */
    getRootMetadataElements(): Map<Path, MetadataElement>;
    /**
     * Returns a specific metadata element specified by its path.
     *
     * @param path Path identifying the metadata element (conforming to EDMX, i.e. function/action segments can also be without ())
     * @returns Metadata element
     */
    getMetadataElement(path: Path): MetadataElement | undefined;
    /**
     * Get Action or Function overloads by their top level name.
     *
     * @param topLevelName First segment represents action function name.
     * @returns if first segment represents action function name (without signature).
     */
    private getActionFunctionOverloads;
    /**
     * Get OData target kinds for a metadata element.
     *
     * @param path Path identifying metadata element.
     * @returns OData target kinds.
     */
    getEdmTargetKinds(path: Path): TargetKind[];
    /**
     * Get (LSP) Locations of metadata element.
     *
     * @param path - path identifying metadata element
     * @returns Locations for the metadata element
     */
    getMetadataElementLocations(path: string): Location[];
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
    useService(serviceId: string): this;
    /**
     * Resets the current service context to the default main service.
     */
    [Symbol.dispose](): void;
    /**
     * Returns namespace's service key
     *
     * @param namespace - namespace name
     * @returns namespace's service key
     */
    getServiceKeyByNamespace(namespace?: string): string;
    /**
     * @returns service id list
     */
    getServiceIds(): string[];
}
//# sourceMappingURL=metadata-service.d.ts.map