import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client, waitUntilObjectNotExists } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import handleError from "src/common/function/handleError";
import { IStorageService } from "src/typings/types";

@Injectable()
export class StorageS3Service implements IStorageService {
  s3Client: S3Client;
  
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile( 
    file: Express.Multer.File,
    key: string,
  ) {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    try {
      await this.s3Client.send(command);
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async deleteFile(
    key: string,
  ) {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });

    try {
      await this.s3Client.send(command);

      await waitUntilObjectNotExists(
        { 
          client: this.s3Client,
          maxWaitTime: 6,
          minDelay: 5,
        },
        {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key,
        },
      );
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async generatePresignedGetUrl(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600 * 3,
      });
    } catch (err) {
      handleError(err);
    }
  }
}