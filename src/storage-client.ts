export const ERROR_CODE_NOT_FOUND: string = 'NotFound';

/**
 * Unified interface for simple storage clients.
 */
export interface IStorageClient {
    isInitialized(): boolean;
    initialize(...initializationArguments: string[]);
    fileExists(storageFilePath: string, containerOrBucketName?: string): Promise<boolean>;
    listFilesWithPrefix(storageFileNamePrefix: string, containerOrBucketName?: string): Promise<any>;
    listFileNamesWithPrefix(storageFileNamePrefix?: string, containerOrBucketName?: string): Promise<string[]>;
    downloadFile(storageFilePath: string, containerOrBucketName?: string): Promise<any>;
    downloadFileToDisk(storageFilePath: string, localFilePath: string, containerOrBucketName?: string): Promise<any>;
    uploadFile(localFilePath: string, storageFilePath: string, containerOrBucketName?: string): Promise<any>;
    deleteFiles(storageFilePaths: string[], containerOrBucketName?: string): Promise<any>;
    deleteFile(storageFilePath: string, containerOrBucketName?: string): Promise<any>;
}
