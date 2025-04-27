import { BlobStorageService } from '@src/infra/azure/blob/service/blob-storage.service';
import type { StorageSharedKeyCredential } from '@azure/storage-blob';
import { Test } from '@nestjs/testing';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';

jest.mock('@azure/storage-blob', () => {
  return {
    BlobServiceClient: jest.fn(() => ({
      getContainerClient: jest.fn(() => ({
        getBlockBlobClient: jest.fn(() => ({
          uploadStream: jest.fn(),
          url: 'https://test.blob.core.windows.net/container/blob',
        })),
      })),
    })),
    StorageSharedKeyCredential: jest.fn(),
    generateBlobSASQueryParameters: jest.fn(() => ({
      toString: () => 'sastoken',
    })),
    BlobSASPermissions: {
      parse: jest.fn(() => ({})),
    },
    SASProtocol: {
      Https: 'https',
    },
  };
});

jest.mock('fs', () => ({
  createReadStream: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  unlink: jest.fn(),
}));

describe('[unit] Azure Blob Storage', () => {
  const mockBlobClient = {
    uploadStream: jest.fn(),
    url: 'https://test.blob.core.windows.net/container/blob',
  };

  const mockContainerClient = {
    getBlockBlobClient: jest.fn(() => mockBlobClient),
  };

  const mockBlobServiceClient = {
    getContainerClient: jest.fn(() => mockContainerClient),
  };

  const mockCredential = {} as StorageSharedKeyCredential;
  const containerName = 'test-container';

  let blobStorageService: BlobStorageService;

  beforeAll(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        BlobStorageService,
        { provide: 'BLOB_CLIENT', useValue: mockBlobServiceClient },
        { provide: 'BLOB_CREDENTIAL', useValue: mockCredential },
        { provide: 'BLOB_CONTAINER', useValue: containerName },
      ],
    }).compile();

    blobStorageService = moduleRef.get<BlobStorageService>(BlobStorageService);
  });

  it('파일 업로드에 성공하면 URL과 SAS URL을 반환한다.', async () => {
    (mockBlobClient.uploadStream as jest.Mock).mockResolvedValue(undefined);
    (createReadStream as jest.Mock).mockReturnValue({});

    const result = await blobStorageService.uploadFileFromPath('/tmp/test.mp4', 'video/mp4');

    expect(mockBlobServiceClient.getContainerClient).toHaveBeenCalledWith(containerName);
    expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalled();
    expect(mockBlobClient.uploadStream).toHaveBeenCalled();
    expect(result.url).toContain('https://test.blob.core.windows.net/container');
    expect(result.sasUrl).toContain('?'); // SAS 토큰 붙는지
    expect(unlink).toHaveBeenCalledWith('/tmp/test.mp4');
  });

  it('파일 업로드에 실패하면 예외를 던진다.', async () => {
    (mockBlobClient.uploadStream as jest.Mock).mockRejectedValue(new Error('Upload failed'));
    (createReadStream as jest.Mock).mockReturnValue({});

    await expect(blobStorageService.uploadFileFromPath('/tmp/fail.mp4', 'video/mp4')).rejects.toThrow('Upload failed');

    expect(unlink).toHaveBeenCalledWith('/tmp/fail.mp4');
  });
});
