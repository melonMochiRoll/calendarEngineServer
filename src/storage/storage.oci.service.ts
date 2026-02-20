import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client, waitUntilObjectNotExists } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import path from "path";
import { IStorageService } from "src/typings/types";

@Injectable()
export class StorageOciService implements IStorageService {
  ociClient: S3Client;
  
  constructor() {
    this.ociClient = new S3Client({
      region: process.env.OCI_REGION,
      endpoint: process.env.OCI_ENDPOINT,
      credentials: {
        accessKeyId: process.env.OCI_ACCESS_KEY_ID,
        secretAccessKey: process.env.OCI_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });
  }

  generateStorageKey(
    url: string,
    fileName: string,
  ) {
    const folderNameMap = {
      's3': process.env.AWS_S3_FOLDER_NAME,
      'oci': process.env.OCI_FOLDER_NAME,
      'r2': process.env.R2_FOLDER_NAME,
    };

    return `${folderNameMap[process.env.STORAGE_PROVIDER]}/${url}/${performance.now()}${path.extname(fileName)}`
  }

  async uploadFile(
    file: Express.Multer.File,
    key: string,
  ) {
    const command = new PutObjectCommand({
      Bucket: process.env.OCI_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await this.ociClient.send(command);
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: process.env.OCI_BUCKET_NAME,
      Key: key,
    });

    await this.ociClient.send(command);

    await waitUntilObjectNotExists(
      { 
        client: this.ociClient,
        maxWaitTime: 6,
        minDelay: 5,
      },
      {
        Bucket: process.env.OCI_BUCKET_NAME,
        Key: key,
      },
    );
  }

  async generatePresignedGetUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: process.env.OCI_BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(this.ociClient, command, {
      expiresIn: 3600 * 3,
    });
  }

  async generatePresignedPutUrl(key: string) {
    const command = new PutObjectCommand({
      Bucket: process.env.OCI_BUCKET_NAME,
      Key: key,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    return await getSignedUrl(this.ociClient, command);
  }
}