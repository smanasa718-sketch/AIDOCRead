import type { Token, TokenV6, XsnCompileModel } from '@sap/cds-compiler-types';
import type { AnnotationFile, Namespace, Reference, CompilerMessage } from '@sap-ux/odata-annotation-core';
import type { CSN, ServiceInfo } from '@sap-ux/project-access';
import type { BlitzIndex, PropagatedTargetMap } from '.';
import type { MetadataCollector, MetadataElementMap } from './metadata';
import type { CdsDocument } from './cdsDocument';
import type { CdsFacade } from './types';
/**
 * To abstract the calls to undocumented functionalities of @sap/cds-compiler module
 *
 */
export interface CdsCompilerFacade {
    readonly blitzIndex: BlitzIndex;
    /**
     * gets tokens for a file.
     *
     * @param uri
     * @returns
     */
    getTokensForUri(uri: string): Token[] | TokenV6[];
    /**
     * Gets CDS document for the given file URI.
     *
     * @param uri
     */
    getCdsDocument(uri: string): CdsDocument | undefined;
    /**
     * gets map of transformed metadata from compile model artifacts.
     *
     * @param serviceName
     * @returns
     */
    getMetadata(serviceName?: string): MetadataElementMap;
    /**
     * gets propagated annotation targets.
     *
     * @param files
     * @returns
     */
    getGhostFiles(files: AnnotationFile[]): AnnotationFile[];
    /**
     * gets metadataCollector instance.
     *
     * @param metadataElementMap
     * @returns
     */
    /**
     * gets compiler errors on the project.
     *
     * @param projectRoot
     * @returns
     */
    getCompilerErrors(projectRoot: string): Map<string, CompilerMessage>;
    /**
     * gets a relative - absolute uri map.
     *
     * @returns
     */
    getUriMap(): Map<string, string>;
    /**
     * Returns file sequence from the lower layer (least important) to top layer (most important).
     * @returns
     */
    getFileSequence(): string[];
    /**
     * gets file names.
     *
     * @param serviceName
     * @returns
     */
    getFileName(serviceName: string): string | undefined;
    /**
     * gets map of propagated targets.
     *
     * @param serviceName
     * @param files
     * @returns
     */
    getPropagatedTargetMap(serviceName?: string | undefined, files?: AnnotationFile[] | undefined): {
        propagationMap: PropagatedTargetMap;
        sourceUris: Set<string>;
    };
    /**
     * gets namespace and references for a given uri.
     *
     * @param uri
     * @returns {{ namespace: Namespace; references: Reference[] } | undefined}
     */
    getNamespaceAndReference(uri: string): {
        namespace: Namespace;
        references: Reference[];
    } | undefined;
    /**
     * gets all the source uris as string collection.
     *
     * @returns
     */
    getAllSourceUris(): string[];
    /**
     * gets the kind of a given service.
     *
     * @param serviceName
     * @returns
     */
    getServiceKind(serviceName: string): string;
    /**
     * Collects metadata elements for absolute path (cds syntax), returns path in EDMX syntax
     *
     * @param cdsPath - path extracted from carrier e.g. AdminService.Books.title or AdminService.Books.addRating
     * @param cdsKind - cds kind, e.g. 'entity', 'element', 'action', 'function', 'param'
     * @param metadataCollector
     * @returns path in EDMX format and key for corresponding entry in MetadataCollector
     */
    collectMetadataForAbsolutePath(cdsPath: string, cdsKind: string, metadataCollector: MetadataCollector): {
        edmxPath: string;
        collectorKey: string;
    };
    /**
     * Collects metadata elements for relative path
     *
     * @param relativePath
     * @param baseCollectorKey - key for collector entry representing base for relative path
     * @param serviceName
     * @param metadataCollector
     */
    collectMetadataForRelativePath(relativePath: string, baseCollectorKey: string, serviceName: string, metadataCollector: MetadataCollector): void;
    /**
     * convert name to edmx name (converting '.text' to '_text')
     *  - reason: generated EDMX will contain name with '_text'
     * @param name
     */
    convertNameToEdmx(name: string): string;
    /**
     * convert name from edmx name (converting '_text' to '.text')
     * @param name
     */
    convertNameFromEdmx(name: string): string | undefined;
    /**
     * Returns the CSN representation of the compile model.
     *
     * @warning This is not available when in CDS LSP.
     */
    getCsn(): CSN;
    /**
     * Gets a list of services defined in the compile model.
     *
     * @warning This is not available when in CDS LSP.
     */
    getServiceInfo(): ServiceInfo[];
}
/**
 * Creates a facade that calls to undocumented functionalities of @sap/cds-compiler module.
 *
 * @param XsnCompileModel
 * @returns
 */
export declare function createCdsCompilerFacade(compileModel: XsnCompileModel, root?: string, cds?: CdsFacade): CdsCompilerFacade;
//# sourceMappingURL=facade.d.ts.map