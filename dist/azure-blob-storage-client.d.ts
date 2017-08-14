import * as azure from 'azure-storage';
import { IStorageClient } from './storage-client';
/**
 * A simple Azure Blob Service wrapper.
 */
export declare class AzureBlobStorageClient implements IStorageClient {
    protected azureBlobService: azure.BlobService;
    protected defaultContainerName: string;
    /**
     * @return True, if this instance is initialized. False otherwise.
     */
    isInitialized(): boolean;
    /**
     * Initializes the client.
     *
     * @param blobStorageAccountName The account name of the Azure Blob Storage.
     * @param blobStorageAccessKey The Azure Blob Storage acccess key.
     * @param defaultContainerName The name of the default container (optional).
     */
    initialize(blobStorageAccountName: string, blobStorageAccessKey: string, defaultContainerName?: string): void;
    /**
     * @return The default blob storage container name if any.
     */
    getDefaultContainerName(): string;
    /**
     * Checks if a blob with the given name exists in the given container.
     *
     * @param blobName The name of the blob to check including the name.
     * @param containerName The name of the Azure Blob Storage container.
     * @return True, if the file exists. False otherwise.
     */
    fileExists(blobName: string, containerName?: string): Promise<boolean>;
    /**
     * Lists the blobs with the given prefix in the given container.
     * Note that this is can be an expensive method to call!
     *
     * @param blobNamePrefix The blob name prefix.
     * @param containerName The container name.
     * @return A list of files found or an error message in case of a failure.
     */
    listFilesWithPrefix(blobNamePrefix: string, containerName?: string): Promise<any>;
    /**
     * Lists the names of the blobs with the given prefix in the given container.
     * Note that this is can be an expensive method to call!
     *
     * @param blobNamePrefix The blob name prefix.
     * @param containerName The container name.
     * @return A string list of file names found or an error message in case of a failure.
     */
    listFileNamesWithPrefix(blobNamePrefix?: string, containerName?: string): Promise<string[]>;
    /**
     * Not implemented.
     */
    downloadFile(blobName: string, containerName?: string): Promise<any>;
    /**
     * Downloads a blob with the given path to the disk in the specified location.
     *
     * @param blobName The name of the blob to download.
     * @param localFilePath The desired local path to store the blob/file in.
     * @param containerName The name of the container containing the file.
     * @return Information related to the operation when successful. An error message otherwise.
     */
    downloadFileToDisk(blobName: string, localFilePath: string, containerName?: string): Promise<any>;
    /**
     * Uploads the given file to the specified container using the specified blob name/path.
     *
     * @param localFilePath The local path of the file to upload.
     * @param blobName The name/path of the destination blob.
     * @param containerName The name of the container where the file is uploaded.
     * @return Information related to the operation when successful. An error message otherwise.
     */
    uploadFile(localFilePath: string, blobName: string, containerName?: string): Promise<any>;
    /**
     * Deletes the given blobs from the specified container.
     *
     * @param blobs The blobs to delete.
     * @param containerName The name of the container.
     * @return Information related to the operation when successful. An error message otherwise.
     */
    deleteFiles(blobNames: string[], containerName?: string): Promise<any>;
    /**
     * Deletes the given blob from the specified container.
     *
     * @param blobName The name of the blob to delete.
     * @param containerName The name of the container where the blob to delete is located.
     * @return Information related to the operation when successful. An error message otherwise.
     */
    deleteFile(blobName: string, containerName?: string): Promise<any>;
}
