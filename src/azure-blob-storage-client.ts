import * as azure from 'azure-storage';
import * as _ from 'underscore';
import { IStorageClient } from './storage-client';

const BLOB_NAME_KEY = 'name';

/**
 * A simple Azure Blob Service wrapper.
 */
export class AzureBlobStorageClient implements IStorageClient {
    protected azureBlobService: azure.BlobService = null;
    protected defaultContainerName: string = "";

    /**
     * @return True, if this instance is initialized. False otherwise.
     */
    public isInitialized(): boolean {
        return (this.azureBlobService !== undefined);
    }

    /**
     * Initializes the client.
     * 
     * @param blobStorageAccountName The account name of the Azure Blob Storage.
     * @param blobStorageAccessKey The Azure Blob Storage acccess key.
     * @param defaultContainerName The name of the default container (optional).
     */
    public initialize(blobStorageAccountName: string, blobStorageAccessKey: string, defaultContainerName?: string) {
        this.azureBlobService = new azure.BlobService(blobStorageAccountName, blobStorageAccessKey);
        this.defaultContainerName = defaultContainerName;
    }

    /**
     * @return The default blob storage container name if any.
     */
    public getDefaultContainerName(): string {
        return this.defaultContainerName;
    }

    /**
     * Checks if a blob with the given name exists in the given container.
     * 
     * @param blobName The name of the blob to check including the name.
     * @param containerName The name of the Azure Blob Storage container.
     * @return True, if the file exists. False otherwise.
     */
    public fileExists(blobName: string, containerName?: string): Promise<boolean> {
        containerName = containerName || this.defaultContainerName;
        let thisInstance: AzureBlobStorageClient = this;

        return new Promise<boolean>(function(resolve) {
            thisInstance.azureBlobService.getBlobProperties(containerName, blobName, function(error, properties, status) {
                if (error || !status.isSuccessful) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    /**
     * Lists the blobs with the given prefix in the given container.
     * Note that this is can be an expensive method to call!
     * 
     * @param blobNamePrefix The blob name prefix.
     * @param containerName The container name.
     * @return A list of files found or an error message in case of a failure.
     */
    public listFilesWithPrefix(blobNamePrefix: string, containerName?: string): Promise<any> {
        containerName = containerName || this.defaultContainerName;
        let thisInstance: AzureBlobStorageClient = this;

        return new Promise(function(resolve, reject) {
            thisInstance.azureBlobService.listBlobsSegmentedWithPrefix(containerName, blobNamePrefix, null, null, function(error, result, response) {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            });
        });
    }

    /**
     * Lists the names of the blobs with the given prefix in the given container.
     * Note that this is can be an expensive method to call!
     * 
     * @param blobNamePrefix The blob name prefix.
     * @param containerName The container name.
     * @return A string list of file names found or an error message in case of a failure.
     */
    public async listFileNamesWithPrefix(blobNamePrefix?: string, containerName?: string): Promise<string[]> {
        containerName = containerName || this.defaultContainerName;
        let thisInstance: AzureBlobStorageClient = this;

        return new Promise<string[]>(function(resolve, reject) {
            thisInstance.listFilesWithPrefix(blobNamePrefix, containerName).then(function(result) {
                let fileNames: string[] = _.pluck(result.entries, BLOB_NAME_KEY);
                resolve(fileNames);
            }).catch(function(errorMessage) {
                reject(errorMessage);
            });
        });
    }

    /**
     * Not implemented.
     */
    public downloadFile(blobName: string, containerName?: string): Promise<any> {
        throw new Error("Method not implemented");
    }

    /**
     * Downloads a blob with the given path to the disk in the specified location.
     * 
     * @param blobName The name of the blob to download.
     * @param localFilePath The desired local path to store the blob/file in.
     * @param containerName The name of the container containing the file.
     * @return Information related to the operation when successful. An error message otherwise.
     */
    public downloadFileToDisk(blobName: string, localFilePath: string, containerName?: string): Promise<any> {
        containerName = containerName || this.defaultContainerName;
        let thisInstance: AzureBlobStorageClient = this;

        return new Promise(function(resolve, reject) {
            thisInstance.azureBlobService.getBlobToLocalFile(containerName, blobName, localFilePath, null, function(error, result) {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            });
        });
    }

    /**
     * Uploads the given file to the specified container using the specified blob name/path.
     * 
     * @param localFilePath The local path of the file to upload.
     * @param blobName The name/path of the destination blob.
     * @param containerName The name of the container where the file is uploaded.
     * @return Information related to the operation when successful. An error message otherwise.
     */
    public uploadFile(localFilePath: string, blobName: string, containerName?: string): Promise<any> {
        containerName = containerName || this.defaultContainerName;
        let thisInstance: AzureBlobStorageClient = this;

        return new Promise<{}>(function(resolve, reject) {
            thisInstance.azureBlobService.createBlockBlobFromLocalFile(containerName, blobName, localFilePath, function(error, result, response) {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            });
        });
    }

    /**
     * Deletes the given blobs from the specified container.
     * 
     * @param blobs The blobs to delete.
     * @param containerName The name of the container.
     * @return Information related to the operation when successful. An error message otherwise.
     */
    public async deleteFiles(blobNames: string[], containerName?: string): Promise<any> {
        containerName = containerName || this.defaultContainerName;
        return Promise.all(blobNames.map((blobName) => this.azureBlobService.deleteBlob(containerName, blobName, function() {})));
    }
    
    /**
     * Deletes the given blob from the specified container.
     * 
     * @param blobName The name of the blob to delete.
     * @param containerName The name of the container where the blob to delete is located.
     * @return Information related to the operation when successful. An error message otherwise.
     */
    public async deleteFile(blobName: string, containerName?: string): Promise<any> {
        containerName = containerName || this.defaultContainerName;
        let thisInstance: AzureBlobStorageClient = this;

        return new Promise(function(resolve, reject) {
            thisInstance.azureBlobService.deleteBlob(containerName, blobName, function(error, response) {
                if (error) {
                    reject(error);
                } else {
                    resolve(response);
                }
            });
        });
    }
}
