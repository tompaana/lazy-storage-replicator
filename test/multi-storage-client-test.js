
/*
 * To run the test type command:
 * LOG_LEVEL=info NODE_ENV=local-dev ./node_modules/.bin/nodeunit ./test/multi-storage-client-test.js
 */

const fs = require('fs');
const path = require('path');
const uuid = require('node-uuid');
const { MultiStorageClient, StorageType } = require('../dist/multi-storage-client');

/*
 * Define the following values as per the details of your accounts
 */
const TEST_AZURE_BLOB_STORAGE_ACCOUNT_NAME = ''; // The account name is the same as the beginning of the storage URI
const TEST_AZURE_BLOB_STORAGE_ACCESS_KEY = '';
const TEST_AWS_S3_ACCESS_KEY_ID = '';
const TEST_AWS_S3_SECRET_ACCESS_KEY = '';
const TEST_AWS_S3_REGION = 'eu-west-2'; // See http://docs.aws.amazon.com/general/latest/gr/rande.html
const TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME = '';
const TEST_AWS_S3_BUCKET_NAME = TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME; // Change if the bucket name does not match the container name

const TEST_STORAGE_FILE_NAME_PREFIX = `test_${uuid.v1()}`;
const TEST_STORAGE_FILE_NAME_1 = `${TEST_STORAGE_FILE_NAME_PREFIX}_1.jpg`; // Also known as file "key" in S3
const TEST_LOCAL_FILE_PATH_PREFIX = './test/data/'
const TEST_LOCAL_FILE_PATH_1 = `${TEST_LOCAL_FILE_PATH_PREFIX}1.jpg`;
const TEMP_FOLDER = fs.mkdtempSync(`${TEST_LOCAL_FILE_PATH_PREFIX}tmp-`);


function getTestMultiStorageClient() {
    const multiStorageClient = new MultiStorageClient();

    multiStorageClient.initialize(
      TEST_AZURE_BLOB_STORAGE_ACCOUNT_NAME, TEST_AZURE_BLOB_STORAGE_ACCESS_KEY,
      TEST_AWS_S3_ACCESS_KEY_ID, TEST_AWS_S3_SECRET_ACCESS_KEY, TEST_AWS_S3_REGION,
      TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);

    return multiStorageClient;
}

function getTestFunc(getTestClient) {
  return ({
    /**
     * This is called before every test.
     * 
     * @param {*} callback 
     */
    async setUp(callback) {
      callback();
    },
    /**
     * This is called after every test.
     * 
     * @param {*} callback 
     */
    async tearDown(callback) {
      try {
        const client = getTestClient();

        var fileNamesToDelete = await client.listFileNamesWithPrefix(
          TEST_STORAGE_FILE_NAME_PREFIX, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);

        if (fileNamesToDelete && fileNamesToDelete.length > 0) {
          await client.deleteFiles(fileNamesToDelete, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
        }

        const localFiles = fs.readdirSync(TEMP_FOLDER);
        localFiles.forEach(localFile => fs.unlinkSync(path.join(TEMP_FOLDER, localFile)));
      } catch (error) {
        console.error('Test teardown failed: ' + error);
      }

      callback();
    },
    async getClient(test) {
      const client = await getTestMultiStorageClient();
      test.ok(client.isInitialized() === true);
      test.done();
    },
    async uploadAndCheckFileExistsNoFile(test) {
      // No file in either of the storages
      const client = await getTestMultiStorageClient();

      var fileExists = await client.fileExists(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(fileExists === false);
      
      var storagesContainingFile = await client.storagesContainingFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(storagesContainingFile === StorageType.Undefined);

      test.done();
    },
    async uploadAndCheckFileExistsAndDeleteS3(test) {
      // File only in S3
      const client = await getTestMultiStorageClient();
      
      var storagesWhereFileWasUploaded = await client.uploadFileToStorage(
        TEST_LOCAL_FILE_PATH_1, TEST_STORAGE_FILE_NAME_1,
        StorageType.AwsS3, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(storagesWhereFileWasUploaded == StorageType.AwsS3);
      
      var fileExists = await client.fileExists(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(fileExists === true);

      var storagesContainingFile = await client.storagesContainingFile(
        TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(storagesContainingFile == StorageType.AwsS3);

      // Clean up
      var deleteFileResult = await client.deleteFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(deleteFileResult === null);

      fileExists = await client.fileExists(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(fileExists === false);

      test.done();
    },
    async uploadAndCheckFileExistsAndDeleteAzure(test) {
      // File only in Azure
      const client = await getTestMultiStorageClient();

      var storagesWhereFileWasUploaded = await client.uploadFileToStorage(
        TEST_LOCAL_FILE_PATH_1, TEST_STORAGE_FILE_NAME_1,
        StorageType.AzureBlobStorage, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(storagesWhereFileWasUploaded == StorageType.AzureBlobStorage);

      var fileExists = await client.fileExists(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(fileExists === true);

      var storagesContainingFile = await client.storagesContainingFile(
        TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(storagesContainingFile === StorageType.AzureBlobStorage);

      // Clean up
      var deleteFileResult = await client.deleteFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(deleteFileResult === null);

      fileExists = await client.fileExists(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(fileExists === false);

      test.done();
    },
    async uploadAndCheckFileExistsAndDeleteBothStorages(test) {
      // File in both storages
      const client = await getTestMultiStorageClient();
      await client.uploadFileToStorage(TEST_LOCAL_FILE_PATH_1, TEST_STORAGE_FILE_NAME_1, StorageType.AzureBlobStorage | StorageType.AwsS3, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      var storagesContainingFile = await client.storagesContainingFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(storagesContainingFile === (StorageType.AzureBlobStorage | StorageType.AwsS3));

      // Clean up
      await client.deleteFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      storagesContainingFile = await client.storagesContainingFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(storagesContainingFile === StorageType.Undefined);

      test.done();
    },
    async downloadFileToDiskAndReplicateNoFile(test) {
      const client = await getTestMultiStorageClient();
      var result = await client.downloadFileToDiskAndReplicateIfNecessary(
        TEST_STORAGE_FILE_NAME_1, TEST_LOCAL_FILE_PATH_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(result != null); // Error is expected
      test.done();
    },
    async downloadFileToDiskAndReplicateFileS3(test) {
      // File in S3, but not in Azure
      const client = await getTestMultiStorageClient();
      
      await client.uploadFileToStorage(
        TEST_LOCAL_FILE_PATH_1, TEST_STORAGE_FILE_NAME_1,
        StorageType.AwsS3, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);

      var storagesContainingFile = await client.storagesContainingFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(storagesContainingFile === StorageType.AwsS3);

      var result = await client.downloadFileToDiskAndReplicateIfNecessary(
        TEST_STORAGE_FILE_NAME_1, TEST_LOCAL_FILE_PATH_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(result === null); // No error

      storagesContainingFile = await client.storagesContainingFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(storagesContainingFile === (StorageType.AzureBlobStorage | StorageType.AwsS3));

      // Clean up
      await client.deleteFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      storagesContainingFile = await client.storagesContainingFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(storagesContainingFile === StorageType.Undefined);

      test.done();
    },
    async downloadFileToDiskAndReplicateFileAzure(test) {
      // File in Azure, but not in S3
      const client = await getTestMultiStorageClient();

      await client.uploadFileToStorage(
        TEST_LOCAL_FILE_PATH_1, TEST_STORAGE_FILE_NAME_1,
        StorageType.AzureBlobStorage, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);

      var storagesContainingFile = await client.storagesContainingFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(storagesContainingFile === StorageType.AzureBlobStorage);

      var result = await client.downloadFileToDiskAndReplicateIfNecessary(
        TEST_STORAGE_FILE_NAME_1, TEST_LOCAL_FILE_PATH_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(result == null); // No error

      storagesContainingFile = await client.storagesContainingFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(storagesContainingFile === (StorageType.AzureBlobStorage | StorageType.AwsS3));

      // Clean up
      await client.deleteFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      storagesContainingFile = await client.storagesContainingFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(storagesContainingFile === StorageType.Undefined);

      test.done();
    },
    async uploadAndDownloadFileToDiskBothStorages(test) {
      const client = await getTestMultiStorageClient();

      await client.uploadFileToStorage(
        TEST_LOCAL_FILE_PATH_1, TEST_STORAGE_FILE_NAME_1,
        (StorageType.AzureBlobStorage | StorageType.AwsS3),
        TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);

      var storagesContainingFile = await client.storagesContainingFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(storagesContainingFile === (StorageType.AzureBlobStorage | StorageType.AwsS3));

      var result = await client.downloadFileToDisk(
        TEST_STORAGE_FILE_NAME_1, TEST_LOCAL_FILE_PATH_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(result == null); // No error

      // Clean up
      await client.deleteFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      storagesContainingFile = await client.storagesContainingFile(TEST_STORAGE_FILE_NAME_1, TEST_AZURE_BLOB_STORAGE_CONTAINER_NAME, TEST_AWS_S3_BUCKET_NAME);
      test.ok(storagesContainingFile === StorageType.Undefined);

      test.done();
    }
  });
}

const testSuite = {};

testSuite.multiStorageClient = getTestFunc(getTestMultiStorageClient);

module.exports = testSuite;
