import { S3 } from 'aws-sdk';
import { IStorageClient } from './storage-client';
export declare const DEFAULT_S3_API_VERSION = "2006-03-01";
export declare const DEFAULT_CONTENT_TYPE = "application/octet-stream";
/**
 * Simple AWS S3 client wrapper.
 */
export declare class AwsS3Client implements IStorageClient {
    protected s3Client: S3;
    protected defaultBucketName: string;
    /**
     * @return True, if this instance is initialized. False otherwise.
     */
    isInitialized(): boolean;
    /**
     * Initializes the client.
     *
     * @param accessKeyId The AWS S3 access key ID.
     * @param secretAccessKey The AWS S3 secret key.
     * @param region The region of the AWS S3.
     * @param defaultBucketName The name of the default bucket (optional).
     * @param s3ApiVersion The AWS S3 API version (optional). If not given, the default value is used.
     */
    initialize(accessKeyId: string, secretAccessKey: string, region: string, defaultBucketName?: string, s3ApiVersion?: string): void;
    /**
     * @return The default S3 bucket name if any.
     */
    getDefaultBucketName(): string;
    /**
     * Checks if a file with the given name exists in the given bucket.
     *
     * @param fileKey The key of the file to check.
     * @param bucketName The bucket name.
     * @return True, if the file exists. False otherwise.
     */
    fileExists(fileKey: string, bucketName?: string): Promise<boolean>;
    /**
     * Lists the files with the given prefix in the given bucket.
     * Note that this is can be an expensive method to call!
     *
     * @param storageFileNamePrefix The prefix of storage file names to list.
     * @param bucketName The bucket name.
     * @return A list of files found.
     */
    listFilesWithPrefix(storageFileNamePrefix: string, bucketName?: string): Promise<S3.Types.ListObjectsV2Output>;
    /**
     * Lists the names of the files with the given prefix in the given bucket.
     * Note that this is can be an expensive method to call!
     *
     * @param storageFileNamePrefix The prefix of storage file names to list.
     * @param bucketName The bucket name.
     * @return A string list of file names found.
     */
    listFileNamesWithPrefix(storageFileNamePrefix?: string, bucketName?: string): Promise<string[]>;
    /**
     * Downloads a file with the given key from the given bucket.
     *
     * @param fileKey The key of the file to download.
     * @param bucketName The name of the bucket containing the file.
     * @return The file as an object.
     */
    downloadFile(fileKey: string, bucketName?: string): Promise<S3.Types.GetObjectOutput>;
    /**
     * Downloads a file with the given key to the disk in the specified location.
     *
     * @param fileKey The key of the file to download.
     * @param localFilePath The desired local path to store the file in.
     * @param bucketName The name of the bucket containing the file.
     * @return Null, if successful. An error otherwise.
     */
    downloadFileToDisk(fileKey: string, localFilePath: string, bucketName?: string): Promise<any>;
    /**
     * Uploads the given file to the specified bucket.
     *
     * @param localFilePath The local path of the file to upload.
     * @param fileKey The destination path/name in S3.
     * @param bucketName The name of the bucket where the file is uploaded.
     * @param contentType The content type of the file. If not specified, the default value is used.
     * @return The result as S3.ManagedUpload.SendData or an error message in case of an error.
     */
    uploadFile(localFilePath: string, fileKey: string, bucketName?: string, contentType?: string): Promise<any>;
    /**
     * Deletes the given files from the specified bucket.
     *
     * @param fileKeys The keys matching the files to delete.
     * @param bucketName The name of the bucket where the files to delete are located.
     * @return S3.DeleteObjectsOutput when successful. An error message otherwise.
     */
    deleteFiles(fileKeys: string[], bucketName?: string): Promise<any>;
    /**
     * Deletes the given file from the specified bucket.
     *
     * @param fileKey The key matching the file to delete.
     * @param bucketName The name of the bucket where the file to delete is located.
     * @return Information related to the operation when successful. An error message otherwise.
     */
    deleteFile(fileKey: string, bucketName?: string): Promise<any>;
}
