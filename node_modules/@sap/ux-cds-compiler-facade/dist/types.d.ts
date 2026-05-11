import type { Range, Position, Location } from '@sap-ux/odata-annotation-core-types';
import type { CapCustomPaths, CSN, ServiceInfo } from '@sap-ux/project-access';
import type { XsnKind } from '@sap/cds-compiler-types';
/**
 * copy of cds-lsp types representing relevant part of BlitzIndex to avoid package dependency to cds-lsp
 */
export interface TokenTemplate {
    text: string;
    line: number;
    character: number;
    tokenIndex: number;
}
export interface IdentifierToken extends GenericToken {
    readonly definitions?: GenericDefinition | GenericDefinition[];
}
export interface GenericDefinition {
    readonly symbolName: string;
    readonly fullyQualifiedName: string;
    readonly kind: XsnKind;
    readonly absoluteName: string;
}
export interface GenericToken extends Position {
    readonly uri: string;
    readonly tokenIndex: number;
    readonly text: string;
    readonly annotationValue?: string;
    readonly range: Range;
    readonly location: Location;
    compare(position: Position): number;
}
export interface AnnotationAssignmentToken extends GenericToken {
    readonly carrier?: IdentifierToken;
    readonly carrierName: string;
    readonly carrierNameRange?: Range;
}
export interface FileIndex {
    idTokens: IdentifierToken[];
    directDependentUris: string[];
    readonly annotationAssignments: IterableIterator<AnnotationAssignmentToken>;
    readonly content: string;
    readonly tokens: Token[];
}
export type AutoCreationMode = 'create' | 'noCreate' | 'warnCreate';
export interface BlitzIndex {
    readonly builtUris: readonly string[];
    getTransitiveDependencies(uri: string): Set<string>;
    forUri(uri: string, create?: AutoCreationMode): FileIndex;
}
export interface Token extends Position {
    /** the actual content of the token */
    readonly text: string;
    /** start line (0-based), fulfills Position */
    readonly line: number;
    /** start column in line (0-based), fulfills Position */
    readonly character: number;
    /** end line (0-based) - currently, only block comments can span over multiple line, though there are considerations to introduce multi-line string literals */
    readonly endLine: number;
    /** 0-based, the position of the next character after the token */
    readonly endCharacter: number;
    /** all tokens are numbered from 0..n-1 */
    readonly tokenIndex: number;
    isComment(): boolean;
}
export interface CdsFacade {
    env: {
        for: (mode: string, path: string) => CdsEnvironment;
    };
    load: (paths: string | string[]) => Promise<{
        $sources: string[];
    }>;
    compile: {
        to: {
            serviceinfo: (model: CSN, options?: {
                root?: string;
            }) => ServiceInfo[];
        };
    };
    resolve: ResolveWithCache;
    root: string;
    version: string;
    home: string;
    parse: (content: string) => ParsedContent;
}
interface ParsedContent {
    requires?: string[];
}
interface ResolveWithCache {
    (files: string | string[], options?: {
        skipModelCache: boolean;
        root: string;
    }): string[];
    cache: Record<string, {
        cached: Record<string, string[]>;
        paths: string[];
    }>;
}
export interface CdsEnvironment {
    folders?: CapCustomPaths;
    cdsc?: {
        moduleLookupDirectories?: string[];
    };
}
export {};
//# sourceMappingURL=types.d.ts.map