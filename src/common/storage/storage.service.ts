import { GetObjectCommand, PutObjectCommand, PutObjectCommandInput, PutObjectCommandOutput, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { AppEnvsConfig } from 'src/config/env.config';
import { FileDownloadedOutput, FileWithTransactionId, ManifestStorage, MetadataFileStoraged } from './types/storage.types';
import { getIngestionFilePath, getIngestionManifestPath } from './utils/utils';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;

  constructor(
    @Inject(AppEnvsConfig.KEY)
    private configService: ConfigType<typeof AppEnvsConfig>,
  ) {
    this.s3Client = new S3Client({ region: this.configService.awsRegion });
  }

  getFileMetadata(file: FileWithTransactionId) {
    const metadata: MetadataFileStoraged = {
      key: getIngestionFilePath(file),
    };
    return metadata;
  }

  async getFileLink(file: FileWithTransactionId) {
    const GetObjectPayload = {
      Bucket: this.configService.manifestBucketName,
      Key: getIngestionFilePath(file),
    };
    const ObjectCommand = new GetObjectCommand(GetObjectPayload);
    return await getSignedUrl(this.s3Client, ObjectCommand, { expiresIn: 900 });
  }

  async getManifestLink(manifest: ManifestStorage) {
    const GetObjectPayload = {
      Bucket: this.configService.manifestBucketName,
      Key: getIngestionManifestPath(manifest),
    };
    const ObjectCommand = new GetObjectCommand(GetObjectPayload);
    return await getSignedUrl(this.s3Client, ObjectCommand, { expiresIn: 900 });
  }

  uploadFile(file: FileWithTransactionId): Promise<PutObjectCommandOutput> {
    const s3Input: PutObjectCommandInput = {
      Bucket: this.configService.manifestBucketName,
      Key: getIngestionFilePath(file),
      ContentType: file.mimetype,
      Body: file.buffer,
    };
    return this.uploadToS3(s3Input);
  }

  uploadManifest(manifest: ManifestStorage): Promise<PutObjectCommandOutput> {
    const s3Input: PutObjectCommandInput = {
      Bucket: this.configService.manifestBucketName,
      Key: getIngestionManifestPath(manifest),
      ContentType: 'application/json',
      Body: JSON.stringify(manifest),
    };
    return this.uploadToS3(s3Input);
  }

  public async downloadImageFile<T = Buffer>(metadata: MetadataFileStoraged): Promise<FileDownloadedOutput<T>> {
    const payload = new GetObjectCommand({
      Bucket: this.configService.manifestBucketName,
      Key: metadata.key,
    });

    const S3File = await this.s3Client.send(payload);
    const fileUnitArray = await S3File.Body?.transformToByteArray();
    const bufferFile = fileUnitArray ? Buffer.from(fileUnitArray) : null;

    return { file: bufferFile as T, mimeType: S3File.ContentType };
  }

  public async downloadTextFile<T = string>(metadata: MetadataFileStoraged): Promise<FileDownloadedOutput<T>> {
    const payload = new GetObjectCommand({
      Bucket: this.configService.manifestBucketName,
      Key: metadata.key,
    });
    const S3File = await this.s3Client.send(payload);
    const stringFile = await S3File.Body?.transformToString();

    return { file: stringFile as T, mimeType: S3File.ContentType };
  }

  protected uploadToS3(s3Input: PutObjectCommandInput): Promise<PutObjectCommandOutput> {
    return this.s3Client.send(new PutObjectCommand(s3Input));
  }
}
