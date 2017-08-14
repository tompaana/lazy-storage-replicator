Lazy Storage Replicator Sample
==============================

This is a proof-of-concept implementation of lazy storage syncing between
[Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/) and
[AWS S3](https://aws.amazon.com/s3). The simple idea is to replicate the requested files to
the storage where they don't exist. For instance, if the file requested only exists in AWS S3, it
will be uploaded to Azure automatically after downloaded from S3.

### Acknowledgments ###

This project is based on the initial work by **Eric Lai** - he created and implemented a unified
interface for Azure Blob Storage and AWS S3 client wrappers.

## Prerequisites ##

You need to have [Node](https://nodejs.org) installed. If you want to build the source, you will
also need [TypeScript](https://www.typescriptlang.org). The built JavaScript files can be found
in `dist` folder.

### Account details and credentials ###

In order to use this sample you need to collect the following credentials and details from your
accounts:

**Azure Blob Storage**

* Account name
* Access key
* Container name

**AWS S3**

* Access key ID
* Secret access key
* Region (where your S3 storage is hosted, e.g. `eu-west-2` if London)
* Bucket name

## Building and running the tests ##

1. Insert your account details and credentials to [/test/multi-storage-client-test.js](https://github.com/tompaana/lazy-storage-replicator/blob/3ddf53b6ebc8904da0c9946eba481e92d02a6aef/test/multi-storage-client-test.js#L15-L21)

2. Run the following commands in the root folder of the project:

    ```
    $ npm install
    $ LOG_LEVEL=info NODE_ENV=local-dev ./node_modules/.bin/nodeunit ./test/multi-storage-client-test.js
    ```

You can also use the provided bash script ([build_and_run_tests.sh](/build_and_run_tests.sh))
to run the tests. If you are running this project in Windows, you can use the following bash shell
options to run the script:

* [Git bash that comes with Git](https://git-scm.com/downloads) (the most lightweight option)
* Bash on Ubuntu on Windows - For this you need to enable *Windows Subsystem for Linux*, see https://msdn.microsoft.com/en-us/commandline/wsl/about
* [Cygwin](https://www.cygwin.com/) (super heavy duty stuff)

## About the implementation ##

![UML Diagram](/doc/LazyStorageReplicatorUMLDiagram.png)

The beef of the project lies in the [multi-storage-client.ts](/src/multi-storage-client.ts) class.
Furthermore, the method [downloadFileToDiskAndReplicateIfNecessary](https://github.com/tompaana/lazy-storage-replicator/blob/3ddf53b6ebc8904da0c9946eba481e92d02a6aef/src/multi-storage-client.ts#L147)
is the one that does the lazy replication/syncing; if the desired file is only found from one of
the storage, it will copied to the one where it's missing. See the documentation in
`multi-storage-client.ts` for all the methods.

## See also ##

* [Microsoft Azure Storage SDK for Node.js documentation](https://azure.github.io/azure-storage-node/index.html)
* [Microsoft Azure Storage Explorer tool](http://storageexplorer.com/)
* [AWS S3 API reference](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html)
