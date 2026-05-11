import type { XsnCompileModel, CompilerModule } from '@sap/cds-compiler-types';
import type { CdsCompilerFacade } from './facade';
import type { CdsFacade } from './types';
export type FileContent = string;
export interface File {
    fileUri: string;
    fileContent: FileContent;
}
export declare function compile(root: string, files: string[], cache?: Map<string, string>): Promise<[XsnCompileModel, CdsFacade | undefined]>;
export declare function compileSync(root: string, files: string[], cache?: Record<string, string | undefined>): [XsnCompileModel, CdsFacade | undefined];
/**
 *
 * @param root Project root
 * @param files List of CDS model entrypoints
 * @param cache File content cache
 */
export declare function createCdsCompilerFacadeForRoot(root: string, files: string[], cache?: Map<string, string>): Promise<CdsCompilerFacade>;
/**
 * Create CDS compiler facade for given project.
 *
 * @param root Project root
 * @param files List of CDS model entrypoints (if empty, all CDS files under roots are included)
 * @param cache File content cache
 */
export declare function createCdsCompilerFacadeForRootSync(root: string, files: string[], cache?: Record<string, string | undefined>): CdsCompilerFacade;
export declare function getModulePathSync(projectRoot: string, moduleName: string): string;
/**
 * Get a reference to the compiler module (@sap/cds-compiler) installed in the Fiori elements project.
 * @param root - project root, where the package.json is
 */
export declare function getCdsCompilerSync(root: string): {
    compiler: CompilerModule;
    home: string;
    cds: CdsFacade;
};
/**
 * Get a reference to the compiler module (@sap/cds-compiler) installed in the Fiori elements project.
 * @param root - project root, where the package.json is
 */
export declare function getCdsCompiler(root: string): Promise<{
    compiler: CompilerModule;
    home: string;
    cds: CdsFacade;
}>;
export declare function getCdsFiles(root: string, fileCache?: Map<string, string>, clearCache?: boolean): Promise<string[]>;
/**
 *  Parse the current contents and check if the reference exists or not.
 *
 * @param root - path of the CDS project.
 * @param currentContent - The current content of the file.
 * @param reference - The reference (path to the document ../abc/testFile).
 *
 * @returns Updated content if the reference needs to be added, otherwise returns undefined.
 */
export declare function updateContentBasedOnReference(root: string, currentContent: string, reference: string): Promise<string | undefined>;
/**
 * Clears the cached global CDS path.
 *
 */
export declare function clearGlobalCdsPathCache(): void;
//# sourceMappingURL=compile.d.ts.map