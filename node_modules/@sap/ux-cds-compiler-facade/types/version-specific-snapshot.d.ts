/// <reference types="jest" />

declare global {
    namespace jest {
        interface Matchers<R, T> {
            toMatchVersionSpecificSnapshot(differentVersions?: VersionDefinition[]): R;
        }
        type CdsBranch = 'next' | 'latest' | 'maintenance';
        interface VersionDefinition {
            branch: CdsBranch;
            matchingVersions?: CdsBranch[];
        }
    }
}

/**
 * This is used to create a customized version of toMatchSpecificSnapshot.
 */
export function toMatchVersionSpecificSnapshot(
    data: any,
    differentVersions: VersionDefinition[],
    testName: string
): () => { message(): string; pass: boolean };
