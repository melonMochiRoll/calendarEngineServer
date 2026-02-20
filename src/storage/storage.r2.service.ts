import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client, waitUntilObjectNotExists } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import path from "path";
import { IStorageService } from "src/typings/types";

@Injectable()
export class StorageR2Service implements IStorageService {
  r2Client: S3Client;
  
  constructor() {
    this.r2Client = new S3Client({
      region: process.env.R2_REGION,
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
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
    key: string
  ) {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await this.r2Client.send(command);
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    await this.r2Client.send(command);

    await waitUntilObjectNotExists(
      { 
        client: this.r2Client,
        maxWaitTime: 6,
        minDelay: 5,
      },
      {
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      },
    );
  }

  async generatePresignedGetUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(this.r2Client, command, {
      expiresIn: 3600 * 3,
    });
  }
  
  async generatePresignedPutUrl(key: string) {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    return await getSignedUrl(this.r2Client, command);
  }
}