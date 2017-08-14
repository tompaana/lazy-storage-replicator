import { S3 } from 'aws-sdk';
import * as fs from 'fs';
import * as mime from 'mime';
import * as _ from 'underscore';
import { IStorageClient, ERROR_CODE_NOT_FOUND } from './storage-client';

export const DEFAULT_S3_API_VERSION = '2006-03-01';
export const DEFAULT_CONTENT_TYPE = 'application/octet-stream';
const FILE_KEY = 'Key';

/**
 * Simple AWS S3 client wrapper.
 */
export class AwsS3Client implements IStorageClient {
    protected s3Client: S3 = null;
    protected defaultBucketName: string = "";

    /**
     * @return True, if this instance is initialized. False otherwise.
     */
    public isInitialized(): boolean {
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
    public initialize(accessKeyId: string, secretAccessKey: string, region: string, defaultBucketName?: string, s3ApiVersion?: string) {
        s3ApiVersion = s3ApiVersion || DEFAULT_S3_API_VERSION;

        this.s3Client = new S3({
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
    public getDefaultBucketName(): string {
        return this.defaultBucketName;
    }

    /**
     * Checks if a file with the given name exists in the given bucket.
     * 
     * @param fileKey The key of the file to check.
     * @param bucketName The bucket name.
     * @return True, if the file exists. False otherwise.
     */
    public fileExists(fileKey: string, bucketName?: string): Promise<boolean> {
        bucketName = bucketName || this.defaultBucketName;

        const parameters = {
            Bucket: bucketName,
            Key: fileKey
        };

        const thisInstance: AwsS3Client = this;

        return new Promise<boolean>(function(resolve) {
            thisInstance.s3Client.headObject(parameters, function (error, metadata) {
                if (error && error.code === ERROR_CODE_NOT_FOUND) {
                    resolve(false);
                } else {  
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
    public async listFilesWithPrefix(storageFileNamePrefix: string, bucketName?: string): Promise<S3.Types.ListObjectsV2Output> {
        bucketName = bucketName || this.defaultBucketName;

        const parameters: S3.Types.ListObjectsV2Request = {
            Bucket: bucketName,
        };

        if (storageFileNamePrefix) {
            parameters.Prefix = storageFileNamePrefix;
        }

        return this.s3Client.listObjectsV2(parameters).promise();
    }

    /**
     * Lists the names of the files with the given prefix in the given bucket.
     * Note that this is can be an expensive method to call!
     * 
     * @param storageFileNamePrefix The prefix of storage file names to list.
     * @param bucketName The bucket name.
     * @return A string list of file names found.
     */
    public async listFileNamesWithPrefix(storageFileNamePrefix?: string, bucketName?: string): Promise<string[]> {
        const result = await this.listFilesWithPrefix(storageFileNamePrefix, bucketName);
        return _.pluck(result.Contents, FILE_KEY);
    }

    /**
     * Downloads a file with the given key from the given bucket.
     * 
     * @param fileKey The key of the file to download.
     * @param bucketName The name of the bucket containing the file.
     * @return The file as an object.
     */
    public async downloadFile(fileKey: string, bucketName?: string): Promise<S3.Types.GetObjectOutput> {
        bucketName = bucketName || this.defaultBucketName;

        const parameters = {
            Bucket: bucketName,
            Key: fileKey,
        };

        return this.s3Client.getObject(parameters).promise();
    }

    /**
     * Downloads a file with the given key to the disk in the specified location.
     * 
     * @param fileKey The key of the file to download.
     * @param localFilePath The desired local path to store the file in.
     * @param bucketName The name of the bucket containing the file.
     * @return Null, if successful. An error otherwise.
     */
    public downloadFileToDisk(fileKey: string, localFilePath: string, bucketName?: string): Promise<any> {
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
    public uploadFile(localFilePath: string, fileKey: string, bucketName?: string, contentType?: string): Promise<any> {
        bucketName = bucketName || this.defaultBucketName;
        const readStream = fs.createReadStream(localFilePath);

        if (contentType === undefined) {
            contentType = mime.lookup(localFilePath, DEFAULT_CONTENT_TYPE);
        }

        const parameters = {
            Bucket: bucketName,
            Key: fileKey,
            Body: readStream,
            ContentType: contentType
        };

        let thisInstance: AwsS3Client = this;

        return new Promise(function(resolve, reject) {
            thisInstance.s3Client.upload(parameters, null, function(error, sendData) {
                if (error) {
                    reject(error);
                } else {
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
    public deleteFiles(fileKeys: string[], bucketName?: string): Promise<any> {
        bucketName = bucketName || this.defaultBucketName;
        const keysAsObjects = _.map(fileKeys, (key) => ({ Key: key }) );

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
    public deleteFile(fileKey: string, bucketName?: string): Promise<any> {
        bucketName = bucketName || this.defaultBucketName;

        const parameters = {
            Bucket: bucketName,
            Delete: fileKey
        }

        return new Promise(function(resolve, reject) {
            this.s3Client.deleteObject(parameters, function(error, data) {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });
    }
}
