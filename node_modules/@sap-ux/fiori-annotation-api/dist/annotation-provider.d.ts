import type { ServiceInfo } from '@sap-ux/project-access';
import { ODataVersionType } from '@sap-ux/odata-annotation-core-types';
import type { ServiceArtifacts, TextFile } from './types';
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
export declare function getXmlServiceArtifacts(odataVersion: ODataVersionType, path: string, metadataFile: TextFile, annotationFiles: TextFile[], fileCache: Map<string, string>): ServiceArtifacts;
/**
 *
 */
export declare class CdsAnnotationProvider {
    private static readonly serviceInfoCache;
    private static readonly serviceArtifactCache;
    private static readonly cdsCache;
    private static readonly vocabularyService;
    /**
     * Get CDS service artifacts.
     *
     * @param rootPath - Project root path.
     * @param servicePath - Service path.
     * @param fileCache - File cache.
     * @returns Service artifacts or undefined.
     */
    static getCdsServiceArtifacts(rootPath: string, servicePath: string, fileCache: Map<string, string>): ServiceArtifacts | undefined;
    /**
     * Get CDS services.
     *
     * @param rootPath - Project root path.
     * @param fileCache - File cache.
     * @returns Service info array.
     */
    static getServices(rootPath: string, fileCache: Map<string, string>): ServiceInfo[];
    /**
     * Reset CDS cache clearing compile model and service artifacts.
     *
     * @param rootPath - Project root path.
     * @param fileCache - File cache.
     */
    static resetCache(rootPath: string, fileCache: Map<string, string>): void;
    private static getFacade;
}
/**
 * Normalizes a URL by replacing backslashes with forward slashes and removing leading slashes.
 *
 * @param url - The URL to normalize.
 * @returns The normalized URL.
 */
//# sourceMappingURL=annotation-provider.d.ts.map