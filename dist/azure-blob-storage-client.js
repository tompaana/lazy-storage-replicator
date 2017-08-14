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
const azure = require("azure-storage");
const _ = require("underscore");
const BLOB_NAME_KEY = 'name';
/**
 * A simple Azure Blob Service wrapper.
 */
class AzureBlobStorageClient {
    constructor() {
        this.azureBlobService = null;
        this.defaultContainerName = "";
    }
    /**
     * @return True, if this instance is initialized. False otherwise.
     */
    isInitialized() {
        return (this.azureBlobService !== undefined);
    }
    /**
     * Initializes the client.
     *
     * @param blobStorageAccountName The account name of the Azure Blob Storage.
     * @param blobStorageAccessKey The Azure Blob Storage acccess key.
     * @param defaultContainerName The name of the default container (optional).
     */
    initialize(blobStorageAccountName, blobStorageAccessKey, defaultContainerName) {
        this.azureBlobService = new azure.BlobService(blobStorageAccountName, blobStorageAccessKey);
        this.defaultContainerName = defaultContainerName;
    }
    /**
     * @return The default blob storage container name if any.
     */
    getDefaultContainerName() {
        return this.defaultContainerName;
    }
    /**
     * Checks if a blob with the given name exists in the given container.
     *
     * @param blobName The name of the blob to check including the name.
     * @param containerName The name of the Azure Blob Storage container.
     * @return True, if the file exists. False otherwise.
     */
    fileExists(blobName, containerName) {
        containerName = containerName || this.defaultContainerName;
        let thisInstance = this;
        return new Promise(function (resolve) {
            thisInstance.azureBlobService.getBlobProperties(containerName, blobName, function (error, properties, status) {
                if (error || !status.isSuccessful) {
                    resolve(false);
                }
                else {
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
    listFilesWithPrefix(blobNamePrefix, containerName) {
        containerName = containerName || this.defaultContainerName;
        let thisInstance = this;
        return new Promise(function (resolve, reject) {
            thisInstance.azureBlobService.listBlobsSegmentedWithPrefix(containerName, blobNamePrefix, null, null, function (error, result, response) {
                if (result) {
                    resolve(result);
                }
                else {
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
    listFileNamesWithPrefix(blobNamePrefix, containerName) {
        return __awaiter(this, void 0, void 0, function* () {
            containerName = containerName || this.defaultContainerName;
            let thisInstance = this;
            return new Promise(function (resolve, reject) {
                thisInstance.listFilesWithPrefix(blobNamePrefix, containerName).then(function (result) {
                    let fileNames = _.pluck(result.entries, BLOB_NAME_KEY);
                    resolve(fileNames);
                }).catch(function (errorMessage) {
                    reject(errorMessage);
                });
            });
        });
    }
    /**
     * Not implemented.
     */
    downloadFile(blobName, containerName) {
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
    downloadFileToDisk(blobName, localFilePath, containerName) {
        containerName = containerName || this.defaultContainerName;
        let thisInstance = this;
        return new Promise(function (resolve, reject) {
            thisInstance.azureBlobService.getBlobToLocalFile(containerName, blobName, localFilePath, null, function (error, result) {
                if (result) {
                    resolve(result);
                }
                else {
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
    uploadFile(localFilePath, blobName, containerName) {
        containerName = containerName || this.defaultContainerName;
        let thisInstance = this;
        return new Promise(function (resolve, reject) {
            thisInstance.azureBlobService.createBlockBlobFromLocalFile(containerName, blobName, localFilePath, function (error, result, response) {
                if (result) {
                    resolve(result);
                }
                else {
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
    deleteFiles(blobNames, containerName) {
        return __awaiter(this, void 0, void 0, function* () {
            containerName = containerName || this.defaultContainerName;
            return Promise.all(blobNames.map((blobName) => this.azureBlobService.deleteBlob(containerName, blobName, function () { })));
        });
    }
    /**
     * Deletes the given blob from the specified container.
     *
     * @param blobName The name of the blob to delete.
     * @param containerName The name of the container where the blob to delete is located.
     * @return Information related to the operation when successful. An error message otherwise.
     */
    deleteFile(blobName, containerName) {
        return __awaiter(this, void 0, void 0, function* () {
            containerName = containerName || this.defaultContainerName;
            let thisInstance = this;
            return new Promise(function (resolve, reject) {
                thisInstance.azureBlobService.deleteBlob(containerName, blobName, function (error, response) {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(response);
                    }
                });
            });
        });
    }
}
exports.AzureBlobStorageClient = AzureBlobStorageClient;
//# sourceMappingURL=azure-blob-storage-client.js.map