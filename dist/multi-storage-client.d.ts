import { IStorageClient } from './storage-client';
import { AzureBlobStorageClient } from './azure-blob-storage-client';
import { AwsS3Client } from './aws-s3-client';
/**
 * Storage types.
 */
export declare enum StorageType {
    Undefined = 0,
    AzureBlobStorage = 1,
    AwsS3 = 2,
    Both = 3,
}
/**
 * A simple multi storage client that wraps both Azure Blob Storage client and AWS S3 client.
 */
export declare class MultiStorageClient implements IStorageClient {
    protected azureBlobStorageClient: AzureBlobStorageClient;
    protected awsS3Client: AwsS3Client;
    /**
     * @return True, if this instance is initialized. False otherwise.
     */
    isInitialized(): boolean;
    /**
     * Initializes the client.
     */
    initialize(azureBlobStorageAccountName: string, azureBlobStorageAccessKey: string, awsS3AccessKeyId: string, awsS3SecretAccessKey: string, awsS3Region: string, defaultAzureBlobStorageContainerName?: string, defaultAwsS3BucketName?: string): void;
    /**
     * Checks if a file with the given name exists in the given container/bucket.
     *
     * @param storageFilePath The path of the file to check including the file name.
     * @param containerName The name of the Azure Blob Storage container. If the container name
     * and the S3 bucket name are the same, you only need to provide this one.
     * @param bucketName The name of the S3 bucket.
     * @return The type(s) of the storage(s) containing the file or StorageType.Undefined if not found.
     */
    storagesContainingFile(storageFilePath: string, containerName?: string, bucketName?: string): Promise<StorageType>;
    /**
     * Checks if a file with the given name exists in the given container/bucket.
     *
     * @param storageFilePath The path of the file to check including the file name.
     * @param containerName The name of the Azure Blob Storage container. If the container name
     * and the S3 bucket name are the same, you only need to provide this one.
     * @param bucketName The name of the S3 bucket.
     * @return True, if found. False otherwise.
     */
    fileExists(storageFilePath: string, containerName?: string, bucketName?: string): Promise<boolean>;
    /**
     * Lists the blobs/files in the storages matching the given prefix.
     * Note that this is can be an expensive method to call!
     *
     * @param storageFileNamePrefix The prefix of the names of the storage blobs/files to list.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the AWS S3 bucket.
     * @return A 2-tuple, where blobs found in Azure Blob Storage are first and files found in AWS S3 second.
     */
    listFilesWithPrefix(storageFileNamePrefix: string, containerName?: string, bucketName?: string): Promise<any>;
    /**
     * Lists the names of the blobs/files in the storages matching the given prefix.
     * Note that this is can be an expensive method to call!
     *
     * @param storageFileNamePrefix The prefix of the storage blob/file names to list.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the AWS S3 bucket.
     * @return The list of file names in a string array.
     */
    listFileNamesWithPrefix(storageFileNamePrefix: string, containerName?: string, bucketName?: string): Promise<string[]>;
    /**
     * Downloads the given file from the storage. If the file exists only one of the storages,
     * it will be replicated to the one where it's missing.
     *
     * @param storageFilePath The file/blob path in the storage.
     * @param localFilePath The desired local path for the file.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the S3 bucket.
     * @return Null, if successful. An error otherwise.
     */
    downloadFileToDiskAndReplicateIfNecessary(storageFilePath: string, localFilePath: string, containerName?: string, bucketName?: string): Promise<any>;
    /**
     * Downloads the given file.
     *
     * @param storageFilePath The file/blob path in the storage.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the S3 bucket.
     * @return Null, if successful. An error otherwise.
     */
    downloadFile(storageFilePath: string, containerName?: string, bucketName?: string): Promise<any>;
    /**
     * Downloads the given file to disk.
     *
     * @param storageFilePath The file/blob path in the storage.
     * @param localFilePath The desired local path for the file.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the S3 bucket.
     * @return Null, if successful. An error otherwise.
     */
    downloadFileToDisk(storageFilePath: string, localFilePath: string, containerName?: string, bucketName?: string): Promise<any>;
    /**
     * Uploads the given file to the given storage(s).
     *
     * @param localFilePath The local file path of the file to upload.
     * @param storageFilePath The storage location for the file.
     * @param storageToUse The storage(s) to upload the file to.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the S3 bucket.
     * @param contentType The content type of the file.
     * @return The storages where the file was successfully uploaded.
     */
    uploadFileToStorage(localFilePath: string, storageFilePath: string, storageToUse?: StorageType, containerName?: string, bucketName?: string, contentType?: string): Promise<StorageType>;
    /**
     * Uploads the given file to both storages. Note that the name of the container and bucket
     * are expected to be the same.
     *
     * @param localFilePath The local file path of the file to upload.
     * @param storageFilePath The storage location for the file.
     * @param containerAndBucketName The name of the Azure Blob Storage container and the S3 bucket.
     * @return The storages where the file was successfully uploaded.
     */
    uploadFile(localFilePath: string, storageFilePath: string, containerAndBucketName?: string): Promise<StorageType>;
    /**
     * Tries to delete the given files from both storages.
     *
     * @param filePaths The paths/keys of the files to delete.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the S3 bucket.
     * @return Null, if succssful. An error otherwise.
     */
    deleteFiles(filePaths: string[], containerName?: string, bucketName?: string): Promise<any>;
    /**
     * Tries to delete the given file from both storages.
     *
     * @param filePath The path/key of the file to delete.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the S3 bucket.
     * @return Null, if succssful. An error otherwise.
     */
    deleteFile(filePath: string, containerName?: string, bucketName?: string): Promise<any>;
}
