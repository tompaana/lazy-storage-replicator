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

## Building and running the tests ##

TODO

## About the implementation ##

TODO

## See also ##

TODO: Links to Azure Blob Storage Node SDK and AWS S3 API references, Microsoft Azure Storage Explorer etc.
