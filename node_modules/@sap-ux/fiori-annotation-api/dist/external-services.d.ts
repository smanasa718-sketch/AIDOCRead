import type { ValueListReference } from './types/adapter';
/**
 * Reads the metadata of external services based on the provided definitions and returns a map of the service URI to its metadata content and local file path.
 *
 * @param metadataFilePath - main metadata file path used to resolve the location of external service metadata files.
 * @param relativeBackendPath - relative path from which the external service paths are defined, used to resolve the location of external service metadata files.
 * @param externalServiceDefinitions - A map of external service definitions where the key is the target and the value is an array of references containing the annotation element, its location, and the URIs of the external services.
 * @returns A map where the key is the service URI and the value is an object containing the metadata content and the local file path.
 */
export declare function readExternalServiceMetadata(metadataFilePath: string, relativeBackendPath: string, externalServiceDefinitions: Map<string, ValueListReference[]>): Promise<Map<string, {
    data: string;
    localFilePath: string;
}>>;
//# sourceMappingURL=external-services.d.ts.map