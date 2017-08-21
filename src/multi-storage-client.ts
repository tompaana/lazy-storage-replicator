import { IStorageClient, ERROR_CODE_NOT_FOUND } from './storage-client';
import { AzureBlobStorageClient } from './azure-blob-storage-client';
import { AwsS3Client } from './aws-s3-client';

/**
 * Storage types.
 */
export enum StorageType {
    Undefined = 0,
    AzureBlobStorage = 1,
    AwsS3 = 2,
    Both = 3
};

/**
 * A simple multi storage client that wraps both Azure Blob Storage client and AWS S3 client.
 */
export class MultiStorageClient implements IStorageClient {
    protected azureBlobStorageClient: AzureBlobStorageClient = null;
    protected awsS3Client: AwsS3Client = null;

    /**
     * @return True, if this instance is initialized. False otherwise.
     */
    public isInitialized(): boolean {
        return (this.azureBlobStorageClient.isInitialized() && this.awsS3Client.isInitialized());
    }

    /**
     * Initializes the client.
     */
    public initialize(azureBlobStorageAccountName: string, azureBlobStorageAccessKey: string,
        awsS3AccessKeyId: string, awsS3SecretAccessKey: string, awsS3Region: string,
        defaultAzureBlobStorageContainerName?: string, defaultAwsS3BucketName?: string) {
        this.azureBlobStorageClient = new AzureBlobStorageClient();
        this.azureBlobStorageClient.initialize(azureBlobStorageAccountName, azureBlobStorageAccessKey, defaultAzureBlobStorageContainerName);

        this.awsS3Client = new AwsS3Client();
        this.awsS3Client.initialize(awsS3AccessKeyId, awsS3SecretAccessKey, awsS3Region, defaultAwsS3BucketName);
    }

    /**
     * Checks if a file with the given name exists in the given container/bucket.
     * 
     * @param storageFilePath The path of the file to check including the file name.
     * @param containerName The name of the Azure Blob Storage container. If the container name
     * and the S3 bucket name are the same, you only need to provide this one.
     * @param bucketName The name of the S3 bucket.
     * @return The type(s) of the storage(s) containing the file or StorageType.Undefined if not found.
     */
    public async storagesContainingFile(storageFilePath: string, containerName?: string, bucketName?: string): Promise<StorageType> {
        containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
        bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
        let result: StorageType = StorageType.Undefined;

        var [fileExistsBlob, fileExistsAws] = await Promise.all([
            await this.azureBlobStorageClient.fileExists(storageFilePath, containerName),
            await this.awsS3Client.fileExists(storageFilePath, bucketName)
        ])

        if (fileExistsBlob) {
            result |= StorageType.AzureBlobStorage;
        }

        if (fileExistsAws) {
            result |= StorageType.AwsS3;
        }

        return result;
    }

    /**
     * Checks if a file with the given name exists in the given container/bucket.
     * 
     * @param storageFilePath The path of the file to check including the file name.
     * @param containerName The name of the Azure Blob Storage container. If the container name
     * and the S3 bucket name are the same, you only need to provide this one.
     * @param bucketName The name of the S3 bucket.
     * @return True, if found. False otherwise.
     */
    public async fileExists(storageFilePath: string, containerName?: string, bucketName?: string): Promise<boolean> {
        return (await this.storagesContainingFile(storageFilePath, containerName, bucketName) != StorageType.Undefined);
    }

    /**
     * Lists the blobs/files in the storages matching the given prefix.
     * Note that this is can be an expensive method to call!
     * 
     * @param storageFileNamePrefix The prefix of the names of the storage blobs/files to list.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the AWS S3 bucket.
     * @return A 2-tuple, where blobs found in Azure Blob Storage are first and files found in AWS S3 second.
     */
    public async listFilesWithPrefix(storageFileNamePrefix: string, containerName?: string, bucketName?: string): Promise<{}> {
        containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
        bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
        var blobsFoundInAzureBlobStorage = null;

        try {
            blobsFoundInAzureBlobStorage =
                await this.azureBlobStorageClient.listFilesWithPrefix(storageFileNamePrefix, containerName);
        } catch (error) {
            console.error('Failed to list files: ' + error);
        }

        const filesFoundInS3 = await this.awsS3Client.listFilesWithPrefix(storageFileNamePrefix, bucketName);

        return {
            blobsFoundInAzureBlobStorage,
            filesFoundInS3
        };
    }

    /**
     * Lists the names of the blobs/files in the storages matching the given prefix.
     * Note that this is can be an expensive method to call!
     * 
     * @param storageFileNamePrefix The prefix of the storage blob/file names to list.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the AWS S3 bucket.
     * @return The list of file names in a string array.
     */
    public async listFileNamesWithPrefix(storageFileNamePrefix: string, containerName?: string, bucketName?: string): Promise<string[]> {
        containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
        bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
        let fileNames: string[] = [];

        try {
            fileNames = await this.azureBlobStorageClient.listFileNamesWithPrefix(storageFileNamePrefix, containerName);
        } catch (error) {
            console.error('Failed to list file names: ' + error);
        }

        fileNames.concat(await this.awsS3Client.listFileNamesWithPrefix(storageFileNamePrefix, bucketName));
        return fileNames;
    }


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
    public async downloadFileToDiskAndReplicateIfNecessary(storageFilePath: string, localFilePath:
        string, containerName?: string, bucketName?: string): Promise<any> {
        containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
        bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
        let storagesContainingFile: StorageType = await this.storagesContainingFile(storageFilePath, containerName, bucketName);
        var result = null;

        try {
            if (storagesContainingFile === StorageType.Undefined) {
                // File not found
                result = ERROR_CODE_NOT_FOUND;
            } else if (storagesContainingFile === (StorageType.AzureBlobStorage | StorageType.AwsS3)) {
                // File is already stored in both storages
                await this.azureBlobStorageClient.downloadFileToDisk(storageFilePath, localFilePath, containerName);
            } else if (storagesContainingFile === StorageType.AzureBlobStorage) {
                // File only in Azure
                await this.azureBlobStorageClient.downloadFileToDisk(storageFilePath, localFilePath, containerName);
                await this.awsS3Client.uploadFile(localFilePath, storageFilePath, bucketName);
            } else if (storagesContainingFile === StorageType.AwsS3) {
                // File only in S3
                await this.awsS3Client.downloadFileToDisk(storageFilePath, localFilePath, bucketName);
                await this.azureBlobStorageClient.uploadFile(localFilePath, storageFilePath, containerName);
            }
        } catch (error) {
            result = error;
        }

        return result;
    }

    /**
     * Downloads the given file.
     * 
     * @param storageFilePath The file/blob path in the storage.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the S3 bucket.
     * @return Null, if successful. An error otherwise.
     */
    public async downloadFile(storageFilePath: string, containerName?: string, bucketName?: string): Promise<any> {
        containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
        bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
        let storagesContainingFile: StorageType = await this.storagesContainingFile(storageFilePath, containerName, bucketName);
        var result = null;

        try {
            if (storagesContainingFile === StorageType.Undefined) {
                result = ERROR_CODE_NOT_FOUND;
            } else if (storagesContainingFile & StorageType.AzureBlobStorage) {
                result = await this.azureBlobStorageClient.downloadFile(storageFilePath, containerName);
            } else if (storagesContainingFile & StorageType.AwsS3) {
                result = await this.awsS3Client.downloadFile(storageFilePath, bucketName);
            }
        } catch (error) {
            result = error;
        }

        return result;
    }

    /**
     * Downloads the given file to disk.
     * 
     * @param storageFilePath The file/blob path in the storage.
     * @param localFilePath The desired local path for the file.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the S3 bucket.
     * @return Null, if successful. An error otherwise.
     */
    public async downloadFileToDisk(storageFilePath: string, localFilePath: string, containerName?: string, bucketName?: string): Promise<any> {
        containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
        bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
        let storagesContainingFile: StorageType = await this.storagesContainingFile(storageFilePath, containerName, bucketName);
        var result = null;

        try {
            if (storagesContainingFile === StorageType.Undefined) {
                result = ERROR_CODE_NOT_FOUND;
            } else if (storagesContainingFile & StorageType.AzureBlobStorage) {
                await this.azureBlobStorageClient.downloadFileToDisk(storageFilePath, localFilePath, containerName);
            } else if (storagesContainingFile & StorageType.AwsS3) {
                await this.awsS3Client.downloadFileToDisk(storageFilePath, localFilePath, bucketName);
            }
        } catch (error) {
            result = error;
        }

        return result;
    }

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
    public async uploadFileToStorage(localFilePath: string, storageFilePath: string, storageToUse?: StorageType,
        containerName?: string, bucketName?: string, contentType?: string): Promise<StorageType> {
        storageToUse = storageToUse || (StorageType.AzureBlobStorage | StorageType.AwsS3);
        containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
        bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
        let storagesWhereFileWasUploaded: StorageType = StorageType.Undefined;

        let azurePromise: Promise<any> 
        if (storageToUse & StorageType.AzureBlobStorage) {
            azurePromise = this.azureBlobStorageClient.uploadFile(localFilePath, storageFilePath, containerName)
        }

        let awsPromise: Promise<any>
        if (storageToUse & StorageType.AwsS3) {
            awsPromise = this.awsS3Client.uploadFile(localFilePath, storageFilePath, bucketName, contentType);
        }

        if (storageToUse & StorageType.AzureBlobStorage) {
            try {
                await azurePromise;
                storagesWhereFileWasUploaded |= StorageType.AzureBlobStorage;
            } catch (error) {
                console.error('Failed to upload file to Azure Blob Storage: ' + error);
            }
        }

        if (storageToUse & StorageType.AwsS3) {
            try {
                await awsPromise;
                storagesWhereFileWasUploaded |= StorageType.AwsS3;
            } catch (error) {
                console.error('Failed to upload file to AWS S3: ' + error);
            }
        }

        return storagesWhereFileWasUploaded;
    }

    /**
     * Uploads the given file to both storages. Note that the name of the container and bucket
     * are expected to be the same.
     * 
     * @param localFilePath The local file path of the file to upload.
     * @param storageFilePath The storage location for the file.
     * @param containerAndBucketName The name of the Azure Blob Storage container and the S3 bucket.
     * @return The storages where the file was successfully uploaded.
     */
    public async uploadFile(localFilePath: string, storageFilePath: string, containerAndBucketName?: string): Promise<StorageType> {
        let thisInstance: MultiStorageClient = this;

        return new Promise<StorageType>(function (resolve) {
            thisInstance.uploadFileToStorage(localFilePath, storageFilePath,
                (StorageType.AzureBlobStorage | StorageType.AwsS3), containerAndBucketName).then(function (result) {
                    resolve(result);
                });
        });
    }

    /**
     * Tries to delete the given files from both storages.
     * 
     * @param filePaths The paths/keys of the files to delete.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the S3 bucket.
     * @return Null, if succssful. An error otherwise.
     */
    public async deleteFiles(filePaths: string[], containerName?: string, bucketName?: string): Promise<any> {
        containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
        bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
        var result = null;

        let azurePromise = this.azureBlobStorageClient.deleteFiles(filePaths, containerName);
        let awsPromise = this.awsS3Client.deleteFiles(filePaths, bucketName);

        try {
            await azurePromise;
        } catch (error) {
            result = error;
        };

        try {
            await awsPromise;
        } catch (error) {
            result = error;
        };

        return result;
    }

    /**
     * Tries to delete the given file from both storages.
     * 
     * @param filePath The path/key of the file to delete.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the S3 bucket.
     * @return Null, if succssful. An error otherwise.
     */
    public async deleteFile(filePath: string, containerName?: string, bucketName?: string): Promise<any> {
        let filePaths: string[] = [filePath];
        return await this.deleteFiles(filePaths, containerName, bucketName);
    }
}
