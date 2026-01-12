import { DeleteObjectCommand, PutObjectCommand, S3Client, waitUntilObjectNotExists } from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";
import handleError from "src/common/function/handleError";
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

    try {
      await this.ociClient.send(command);
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: process.env.OCI_BUCKET_NAME,
      Key: key,
    });

    try {
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
    } catch (err) {
      handleError(err);
    }

    return true;
  }
}