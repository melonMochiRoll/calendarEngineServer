import { DeleteObjectCommand, PutObjectCommand, S3Client, waitUntilObjectNotExists } from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";
import handleError from "src/common/function/handleError";


@Injectable()
export class AwsService {
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

  async uploadImageToS3( 
    file: Express.Multer.File,
    key: string,
  ) {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
    });

    try {
      await this.s3Client.send(command);
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async deleteImageFromS3(
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
}