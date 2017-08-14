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
const aws_sdk_1 = require("aws-sdk");
const fs = require("fs");
const mime = require("mime");
const _ = require("underscore");
const storage_client_1 = require("./storage-client");
exports.DEFAULT_S3_API_VERSION = '2006-03-01';
exports.DEFAULT_CONTENT_TYPE = 'application/octet-stream';
const FILE_KEY = 'Key';
/**
 * Simple AWS S3 client wrapper.
 */
class AwsS3Client {
    constructor() {
        this.s3Client = null;
        this.defaultBucketName = "";
    }
    /**
     * @return True, if this instance is initialized. False otherwise.
     */
    isInitialized() {
        return (this.s3Client !== undefined);
    }
    /**
     * Initializes the client.
     *
     * @param accessKeyId The AWS S3 access key ID.
     * @param secretAccessKey The AWS S3 secret key.
     * @param region The region of the AWS S3.
     * @param defaultBucketName The name of the default bucket (optional).
     * @param s3ApiVersion The AWS S3 API version (optional). If not given, the default value is used.
     */
    initialize(accessKeyId, secretAccessKey, region, defaultBucketName, s3ApiVersion) {
        s3ApiVersion = s3ApiVersion || exports.DEFAULT_S3_API_VERSION;
        this.s3Client = new aws_sdk_1.S3({
            region: region,
            apiVersion: s3ApiVersion,
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        });
        this.defaultBucketName = defaultBucketName;
    }
    /**
     * @return The default S3 bucket name if any.
     */
    getDefaultBucketName() {
        return this.defaultBucketName;
    }
    /**
     * Checks if a file with the given name exists in the given bucket.
     *
     * @param fileKey The key of the file to check.
     * @param bucketName The bucket name.
     * @return True, if the file exists. False otherwise.
     */
    fileExists(fileKey, bucketName) {
        bucketName = bucketName || this.defaultBucketName;
        const parameters = {
            Bucket: bucketName,
            Key: fileKey
        };
        const thisInstance = this;
        return new Promise(function (resolve) {
            thisInstance.s3Client.headObject(parameters, function (error, metadata) {
                if (error && error.code === storage_client_1.ERROR_CODE_NOT_FOUND) {
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
        });
    }
    /**
     * Lists the files with the given prefix in the given bucket.
     * Note that this is can be an expensive method to call!
     *
     * @param storageFileNamePrefix The prefix of storage file names to list.
     * @param bucketName The bucket name.
     * @return A list of files found.
     */
    listFilesWithPrefix(storageFileNamePrefix, bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            bucketName = bucketName || this.defaultBucketName;
            const parameters = {
                Bucket: bucketName,
            };
            if (storageFileNamePrefix) {
                parameters.Prefix = storageFileNamePrefix;
            }
            return this.s3Client.listObjectsV2(parameters).promise();
        });
    }
    /**
     * Lists the names of the files with the given prefix in the given bucket.
     * Note that this is can be an expensive method to call!
     *
     * @param storageFileNamePrefix The prefix of storage file names to list.
     * @param bucketName The bucket name.
     * @return A string list of file names found.
     */
    listFileNamesWithPrefix(storageFileNamePrefix, bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.listFilesWithPrefix(storageFileNamePrefix, bucketName);
            return _.pluck(result.Contents, FILE_KEY);
        });
    }
    /**
     * Downloads a file with the given key from the given bucket.
     *
     * @param fileKey The key of the file to download.
     * @param bucketName The name of the bucket containing the file.
     * @return The file as an object.
     */
    downloadFile(fileKey, bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            bucketName = bucketName || this.defaultBucketName;
            const parameters = {
                Bucket: bucketName,
                Key: fileKey,
            };
            return this.s3Client.getObject(parameters).promise();
        });
    }
    /**
     * Downloads a file with the given key to the disk in the specified location.
     *
     * @param fileKey The key of the file to download.
     * @param localFilePath The desired local path to store the file in.
     * @param bucketName The name of the bucket containing the file.
     * @return Null, if successful. An error otherwise.
     */
    downloadFileToDisk(fileKey, localFilePath, bucketName) {
        bucketName = bucketName || this.defaultBucketName;
        const parameters = {
            Bucket: bucketName,
            Key: fileKey,
        };
        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(localFilePath);
            writeStream.on('finish', () => {
                resolve();
            });
            this.s3Client.getObject(parameters).createReadStream().on('error', (error) => {
                fs.unlink(localFilePath);
                return reject(error);
            }).pipe(writeStream);
        });
    }
    /**
     * Uploads the given file to the specified bucket.
     *
     * @param localFilePath The local path of the file to upload.
     * @param fileKey The destination path/name in S3.
     * @param bucketName The name of the bucket where the file is uploaded.
     * @param contentType The content type of the file. If not specified, the default value is used.
     * @return The result as S3.ManagedUpload.SendData or an error message in case of an error.
     */
    uploadFile(localFilePath, fileKey, bucketName, contentType) {
        bucketName = bucketName || this.defaultBucketName;
        const readStream = fs.createReadStream(localFilePath);
        if (contentType === undefined) {
            contentType = mime.lookup(localFilePath, exports.DEFAULT_CONTENT_TYPE);
        }
        const parameters = {
            Bucket: bucketName,
            Key: fileKey,
            Body: readStream,
            ContentType: contentType
        };
        let thisInstance = this;
        return new Promise(function (resolve, reject) {
            thisInstance.s3Client.upload(parameters, null, function (error, sendData) {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(sendData);
                }
            });
        });
    }
    /**
     * Deletes the given files from the specified bucket.
     *
     * @param fileKeys The keys matching the files to delete.
     * @param bucketName The name of the bucket where the files to delete are located.
     * @return S3.DeleteObjectsOutput when successful. An error message otherwise.
     */
    deleteFiles(fileKeys, bucketName) {
        bucketName = bucketName || this.defaultBucketName;
        const keysAsObjects = _.map(fileKeys, (key) => ({ Key: key }));
        const parameters = {
            Bucket: bucketName,
            Delete: {
                Objects: keysAsObjects
            }
        };
        return this.s3Client.deleteObjects(parameters).promise();
    }
    /**
     * Deletes the given file from the specified bucket.
     *
     * @param fileKey The key matching the file to delete.
     * @param bucketName The name of the bucket where the file to delete is located.
     * @return Information related to the operation when successful. An error message otherwise.
     */
    deleteFile(fileKey, bucketName) {
        bucketName = bucketName || this.defaultBucketName;
        const parameters = {
            Bucket: bucketName,
            Delete: fileKey
        };
        return new Promise(function (resolve, reject) {
            this.s3Client.deleteObject(parameters, function (error, data) {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(data);
                }
            });
        });
    }
}
exports.AwsS3Client = AwsS3Client;
//# sourceMappingURL=aws-s3-client.js.map