"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const storage_client_1 = require("./storage-client");
const azure_blob_storage_client_1 = require("./azure-blob-storage-client");
const aws_s3_client_1 = require("./aws-s3-client");
/**
 * Storage types.
 */
var StorageType;
(function (StorageType) {
    StorageType[StorageType["Undefined"] = 0] = "Undefined";
    StorageType[StorageType["AzureBlobStorage"] = 1] = "AzureBlobStorage";
    StorageType[StorageType["AwsS3"] = 2] = "AwsS3";
    StorageType[StorageType["Both"] = 3] = "Both";
})(StorageType = exports.StorageType || (exports.StorageType = {}));
;
/**
 * A simple multi storage client that wraps both Azure Blob Storage client and AWS S3 client.
 */
class MultiStorageClient {
    constructor() {
        this.azureBlobStorageClient = null;
        this.awsS3Client = null;
    }
    /**
     * @return True, if this instance is initialized. False otherwise.
     */
    isInitialized() {
        return (this.azureBlobStorageClient.isInitialized() && this.awsS3Client.isInitialized());
    }
    /**
     * Initializes the client.
     */
    initialize(azureBlobStorageAccountName, azureBlobStorageAccessKey, awsS3AccessKeyId, awsS3SecretAccessKey, awsS3Region, defaultAzureBlobStorageContainerName, defaultAwsS3BucketName) {
        this.azureBlobStorageClient = new azure_blob_storage_client_1.AzureBlobStorageClient();
        this.azureBlobStorageClient.initialize(azureBlobStorageAccountName, azureBlobStorageAccessKey, defaultAzureBlobStorageContainerName);
        this.awsS3Client = new aws_s3_client_1.AwsS3Client();
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
    storagesContainingFile(storageFilePath, containerName, bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
            bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
            let result = StorageType.Undefined;
            var [fileExistsBlob, fileExistsAws] = yield Promise.all([
                yield this.azureBlobStorageClient.fileExists(storageFilePath, containerName),
                yield this.awsS3Client.fileExists(storageFilePath, bucketName)
            ]);
            if (fileExistsBlob) {
                result |= StorageType.AzureBlobStorage;
            }
            if (fileExistsAws) {
                result |= StorageType.AwsS3;
            }
            return result;
        });
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
    fileExists(storageFilePath, containerName, bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            return ((yield this.storagesContainingFile(storageFilePath, containerName, bucketName)) != StorageType.Undefined);
        });
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
    listFilesWithPrefix(storageFileNamePrefix, containerName, bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
            bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
            var blobsFoundInAzureBlobStorage = null;
            try {
                blobsFoundInAzureBlobStorage =
                    yield this.azureBlobStorageClient.listFilesWithPrefix(storageFileNamePrefix, containerName);
            }
            catch (error) {
                console.error('Failed to list files in Azure Blob Storage: ' + error);
            }
            const filesFoundInS3 = yield this.awsS3Client.listFilesWithPrefix(storageFileNamePrefix, bucketName);
            return {
                blobsFoundInAzureBlobStorage,
                filesFoundInS3
            };
        });
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
    listFileNamesWithPrefix(storageFileNamePrefix, containerName, bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
            bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
            let fileNames = [];
            try {
                fileNames = yield this.azureBlobStorageClient.listFileNamesWithPrefix(storageFileNamePrefix, containerName);
            }
            catch (error) {
                console.error('Failed to list file names in Azure Blob Storage: ' + error);
            }
            fileNames.concat(yield this.awsS3Client.listFileNamesWithPrefix(storageFileNamePrefix, bucketName));
            return fileNames;
        });
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
    downloadFileToDiskAndReplicateIfNecessary(storageFilePath, localFilePath, containerName, bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
            bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
            let storagesContainingFile = yield this.storagesContainingFile(storageFilePath, containerName, bucketName);
            var result = null;
            try {
                if (storagesContainingFile === StorageType.Undefined) {
                    // File not found
                    result = storage_client_1.ERROR_CODE_NOT_FOUND;
                }
                else if (storagesContainingFile === (StorageType.AzureBlobStorage | StorageType.AwsS3)) {
                    // File is already stored in both storages
                    yield this.azureBlobStorageClient.downloadFileToDisk(storageFilePath, localFilePath, containerName);
                }
                else if (storagesContainingFile === StorageType.AzureBlobStorage) {
                    // File only in Azure
                    yield this.azureBlobStorageClient.downloadFileToDisk(storageFilePath, localFilePath, containerName);
                    yield this.awsS3Client.uploadFile(localFilePath, storageFilePath, bucketName);
                }
                else if (storagesContainingFile === StorageType.AwsS3) {
                    // File only in S3
                    yield this.awsS3Client.downloadFileToDisk(storageFilePath, localFilePath, bucketName);
                    yield this.azureBlobStorageClient.uploadFile(localFilePath, storageFilePath, containerName);
                }
            }
            catch (error) {
                result = error;
            }
            return result;
        });
    }
    /**
     * Downloads the given file.
     *
     * @param storageFilePath The file/blob path in the storage.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the S3 bucket.
     * @return Null, if successful. An error otherwise.
     */
    downloadFile(storageFilePath, containerName, bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
            bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
            let storagesContainingFile = yield this.storagesContainingFile(storageFilePath, containerName, bucketName);
            var result = null;
            try {
                if (storagesContainingFile === StorageType.Undefined) {
                    result = storage_client_1.ERROR_CODE_NOT_FOUND;
                }
                else if (storagesContainingFile & StorageType.AzureBlobStorage) {
                    result = yield this.azureBlobStorageClient.downloadFile(storageFilePath, containerName);
                }
                else if (storagesContainingFile & StorageType.AwsS3) {
                    result = yield this.awsS3Client.downloadFile(storageFilePath, bucketName);
                }
            }
            catch (error) {
                result = error;
            }
            return result;
        });
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
    downloadFileToDisk(storageFilePath, localFilePath, containerName, bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
            bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
            let storagesContainingFile = yield this.storagesContainingFile(storageFilePath, containerName, bucketName);
            var result = null;
            try {
                if (storagesContainingFile === StorageType.Undefined) {
                    result = storage_client_1.ERROR_CODE_NOT_FOUND;
                }
                else if (storagesContainingFile & StorageType.AzureBlobStorage) {
                    yield this.azureBlobStorageClient.downloadFileToDisk(storageFilePath, localFilePath, containerName);
                }
                else if (storagesContainingFile & StorageType.AwsS3) {
                    yield this.awsS3Client.downloadFileToDisk(storageFilePath, localFilePath, bucketName);
                }
            }
            catch (error) {
                result = error;
            }
            return result;
        });
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
    uploadFileToStorage(localFilePath, storageFilePath, storageToUse, containerName, bucketName, contentType) {
        return __awaiter(this, void 0, void 0, function* () {
            storageToUse = storageToUse || (StorageType.AzureBlobStorage | StorageType.AwsS3);
            containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
            bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
            let storagesWhereFileWasUploaded = StorageType.Undefined;
            let azurePromise;
            if (storageToUse & StorageType.AzureBlobStorage) {
                azurePromise = this.azureBlobStorageClient.uploadFile(localFilePath, storageFilePath, containerName);
            }
            let awsPromise;
            if (storageToUse & StorageType.AwsS3) {
                awsPromise = this.awsS3Client.uploadFile(localFilePath, storageFilePath, bucketName, contentType);
            }
            if (storageToUse & StorageType.AzureBlobStorage) {
                try {
                    yield azurePromise;
                    storagesWhereFileWasUploaded |= StorageType.AzureBlobStorage;
                }
                catch (error) {
                    console.error('Failed to upload file to Azure Blob Storage: ' + error);
                }
            }
            if (storageToUse & StorageType.AwsS3) {
                try {
                    yield awsPromise;
                    storagesWhereFileWasUploaded |= StorageType.AwsS3;
                }
                catch (error) {
                    console.error('Failed to upload file to AWS S3: ' + error);
                }
            }
            return storagesWhereFileWasUploaded;
        });
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
    uploadFile(localFilePath, storageFilePath, containerAndBucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            let thisInstance = this;
            return new Promise(function (resolve) {
                thisInstance.uploadFileToStorage(localFilePath, storageFilePath, (StorageType.AzureBlobStorage | StorageType.AwsS3), containerAndBucketName).then(function (result) {
                    resolve(result);
                });
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
    deleteFiles(filePaths, containerName, bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            containerName = containerName || this.azureBlobStorageClient.getDefaultContainerName();
            bucketName = bucketName || this.awsS3Client.getDefaultBucketName() || containerName;
            var result = null;
            let azurePromise = this.azureBlobStorageClient.deleteFiles(filePaths, containerName);
            let awsPromise = this.awsS3Client.deleteFiles(filePaths, bucketName);
            try {
                yield azurePromise;
            }
            catch (error) {
                result = error;
            }
            try {
                yield awsPromise;
            }
            catch (error) {
                result = error;
            }
            return result;
        });
    }
    /**
     * Tries to delete the given file from both storages.
     *
     * @param filePath The path/key of the file to delete.
     * @param containerName The name of the Azure Blob Storage container.
     * @param bucketName The name of the S3 bucket.
     * @return Null, if succssful. An error otherwise.
     */
    deleteFile(filePath, containerName, bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            let filePaths = [filePath];
            return yield this.deleteFiles(filePaths, containerName, bucketName);
        });
    }
}
exports.MultiStorageClient = MultiStorageClient;
//# sourceMappingURL=multi-storage-client.js.map