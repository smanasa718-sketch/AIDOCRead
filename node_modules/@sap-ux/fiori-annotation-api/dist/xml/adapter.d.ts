import type { AnnotationFile, Target, WorkspaceEdit } from '@sap-ux/odata-annotation-core-types';
import type { Project } from '@sap-ux/project-access';
import type { VocabularyService } from '@sap-ux/odata-vocabularies';
import { MetadataService } from '@sap-ux/odata-entity-model';
import { type LocalEDMXService, type CompiledService, type TextFile, type AnnotationServiceAdapter, type AnnotationFileChange } from '../types';
import type { ValueListReference } from '../types/adapter';
/**
 * XML Annotation Service Adapter.
 * Provides annotation editing capabilities for XML-based OData annotation files.
 */
export declare class XMLAnnotationServiceAdapter implements AnnotationServiceAdapter {
    private readonly service;
    private readonly vocabularyService;
    private readonly project;
    private readonly appName;
    metadataService: MetadataService;
    splitAnnotationSupport: boolean;
    fileCache: Map<string, string>;
    private readonly externalServices;
    /**
     * Mapping from targets to value list references
     */
    private readonly valueListReferences;
    private readonly documents;
    private metadata;
    private setFileCache;
    private _compiledService;
    /**
     * Gets the compiled XML service.
     *
     * @returns Compiled XML service.
     */
    get compiledService(): CompiledService;
    private set compiledService(value);
    /**
     * Creates an instance of XMLAnnotationServiceAdapter.
     *
     * @param service - Service structure.
     * @param vocabularyService - Vocabulary API.
     * @param project - Project information.
     * @param appName - Name of the application.
     */
    constructor(service: LocalEDMXService, vocabularyService: VocabularyService, project: Project, appName: string);
    /**
     * Refreshes internal data structures from the provided project files.
     *
     * @param fileCache - File uri mapped to file content.
     */
    sync(fileCache: Map<string, string>): void;
    /**
     * Refreshes internal data structures from the provided external service data.
     *
     * @param uri - URI of the external service metadata.
     * @param data - Content of the external service metadata file.
     * @param localFilePath - Local file path of the external service metadata file.
     */
    syncExternalService(uri: string, data: string, localFilePath: string): void;
    /**
     * @returns Returns compiled data of all external services.
     */
    getExternalServices(): {
        uri: string;
        metadataService: MetadataService;
        compiledService: CompiledService;
        localFileUri: string;
    }[];
    /**
     * Get annotation documents.
     *
     * @returns Annotation documents.
     */
    getDocuments(): Record<string, AnnotationFile>;
    /**
     * Returns all relevant service files.
     *
     * @returns All relevant service files.
     */
    getAllFiles(): TextFile[];
    /**
     * Creates empty annotation file content for the given service.
     *
     * @param serviceName - Name of the service.
     * @param uri - URI for the new annotation file.
     * @returns New annotation file content.
     */
    getInitialFileContent(serviceName: string, uri: string): string;
    /**
     * Converts changes to workspace edits.
     *
     * @param changes - Internal changes.
     * @returns Workspace edits.
     */
    getWorkspaceEdit(changes: AnnotationFileChange[]): Promise<WorkspaceEdit>;
    /**
     * No checking is done for XML files.
     *
     * @param fileCache - Updated file content.
     * @returns Nothing.
     */
    validateChanges(fileCache: Map<string, string>): void;
    /**
     * Converts annotation object to a string.
     *
     * @param target - Content of an 'Annotations' element.
     * @returns XML representation of the annotations.
     */
    serializeTarget(target: Target): string;
    /**
     * Returns a map of value list references.
     *
     * @returns Map of value list references.
     */
    getValueListReferences(): Map<string, ValueListReference[]>;
    private getUniqueNamespace;
    private _getCompiledService;
    private processChange;
    private getTargetChildReferences;
    private markElementDeletion;
    private markElementInsertion;
    private postprocessEdits;
    private updateReferences;
    private removeReferences;
    private addReferences;
    private addMissingMetadataReferences;
    private getValueListReferencesForTarget;
    private collectValueListReferences;
}
//# sourceMappingURL=adapter.d.ts.map