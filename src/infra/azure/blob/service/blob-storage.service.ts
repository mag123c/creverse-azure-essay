import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} from '@azure/storage-blob';
import { Injectable, Inject } from '@nestjs/common';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class BlobStorageService {
  constructor(
    @Inject('BLOB_CLIENT') private readonly client: BlobServiceClient,
    @Inject('BLOB_CREDENTIAL') private readonly credential: StorageSharedKeyCredential,
    @Inject('BLOB_CONTAINER') private readonly containerName: string,
  ) {}

  async uploadFileFromPath(path: string, contentType: string): Promise<{ url: string; sasUrl: string }> {
    const ext = extname(path);
    const blobName = `${uuid()}${ext}`;
    const containerClient = this.client.getContainerClient(this.containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    const stream = createReadStream(path, { autoClose: true });
    try {
      await blobClient.uploadStream(stream, undefined, undefined, {
        blobHTTPHeaders: { blobContentType: contentType },
      });
    } catch (e) {
      throw e;
    } finally {
      await unlink(path);
    }

    const sasUrl = this.getSasUrl(blobName);

    return {
      url: blobClient.url,
      sasUrl,
    };
  }

  private getSasUrl(blobName: string): string {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    const sas = generateBlobSASQueryParameters(
      {
        containerName: this.containerName,
        blobName,
        expiresOn: expiry,
        permissions: BlobSASPermissions.parse('r'),
        protocol: SASProtocol.Https,
      },
      this.credential,
    );

    const blobUrl = this.client.getContainerClient(this.containerName).getBlockBlobClient(blobName).url;
    return `${blobUrl}?${sas.toString()}`;
  }
}
