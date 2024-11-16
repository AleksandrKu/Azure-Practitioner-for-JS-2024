import { InvocationContext } from "@azure/functions";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import * as XLSX from 'xlsx';
import { blobImportProductsFromFile } from "../../functions/blob-import-products-from-file";

// Mock Azure Functions context
const mockContext: any = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  triggerMetadata: {
    blobTrigger: 'products-container-uploaded/products-service-blob'
  },
  bindingData: {
    name: 'products-service-blob'
  },
  invocationId: 'test-id',
  functionName: 'importProductsFromFile',
  extraInputs: [], // {{ edit_1 }}
  extraOutputs: [], // {{ edit_2 }}
  options: {
    trigger: {
      type: 'blobTrigger',
      name: 'blob',
      direction: 'in'
    },
    extraInputs: [],
    extraOutputs: []
  },
  retryContext: {
    retryCount: 0,
    maxRetryCount: 0,
    exception: null
  }
};

// Mock Azure Storage Blob
jest.mock('@azure/storage-blob', () => {
    const mockContainerClient = {
        createIfNotExists: jest.fn(),
        getBlobClient: jest.fn()
    };

    const mockBlobClient = {
        url: 'https://test.blob.core.windows.net/container/products-service-blob',
        beginCopyFromURL: jest.fn(),
        delete: jest.fn()
    };

    mockContainerClient.getBlobClient.mockReturnValue(mockBlobClient);
    mockBlobClient.beginCopyFromURL.mockResolvedValue({
        pollUntilDone: jest.fn().mockResolvedValue(undefined)
    });

    return {
        BlobServiceClient: {
            fromConnectionString: jest.fn().mockReturnValue({
                getContainerClient: jest.fn().mockReturnValue(mockContainerClient)
            })
        },
        ContainerClient: jest.fn().mockImplementation(() => mockContainerClient)
    };
});

// Mock XLSX
jest.mock('xlsx', () => ({
    read: jest.fn(),
    utils: {
        sheet_to_json: jest.fn()
    }
}));

describe('blobImportProductsFromFile', () => {
    const mockExcelData = [
        { id: 1, name: 'Product 1', price: 10 },
        { id: 2, name: 'Product 2', price: 20 }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        
        (XLSX.read as jest.Mock).mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: {
                Sheet1: {}
            }
        });
        (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockExcelData);

        process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=key;EndpointSuffix=core.windows.net';
    });

    afterEach(() => {
        delete process.env.AzureWebJobsStorage;
    });

    it('should successfully process an Excel file and move it to parsed container', async () => {
        const mockBuffer = Buffer.from('test');

        await blobImportProductsFromFile(mockBuffer, mockContext as InvocationContext);

        expect(XLSX.read).toHaveBeenCalledWith(mockBuffer, { type: 'buffer' });
        expect(XLSX.utils.sheet_to_json).toHaveBeenCalled();

        expect(mockContext.log).toHaveBeenCalledWith(
            expect.stringContaining('Successfully processed 2 records from Excel file')
        );

        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AzureWebJobsStorage!);
        expect(blobServiceClient.getContainerClient).toHaveBeenCalledWith('products-container-uploaded');
        expect(blobServiceClient.getContainerClient).toHaveBeenCalledWith('products-container-parsed');

        const destinationContainerClient = blobServiceClient.getContainerClient('products-container-parsed');
        expect(destinationContainerClient.createIfNotExists).toHaveBeenCalled();

        const sourceBlobClient = destinationContainerClient.getBlobClient('products-service-blob');
        expect(sourceBlobClient.beginCopyFromURL).toHaveBeenCalled();
        expect(sourceBlobClient.delete).toHaveBeenCalled();
    });

    it('should throw error when AzureWebJobsStorage connection string is missing', async () => {
        delete process.env.AzureWebJobsStorage;
        const mockBuffer = Buffer.from('test');

        await expect(blobImportProductsFromFile(mockBuffer, mockContext as InvocationContext))
            .rejects
            .toThrow('Storage connection string not found');
    });

    it('should handle Excel parsing errors', async () => {
        const mockBuffer = Buffer.from('invalid excel data');
        (XLSX.read as jest.Mock).mockImplementation(() => {
            throw new Error('Invalid Excel file');
        });

        await expect(blobImportProductsFromFile(mockBuffer, mockContext as InvocationContext))
            .rejects
            .toThrow('Invalid Excel file');
    });

    it('should process empty Excel file', async () => {
        const mockBuffer = Buffer.from('test');
        (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([]);

        await blobImportProductsFromFile(mockBuffer, mockContext as InvocationContext);

        expect(mockContext.log).toHaveBeenCalledWith(
            expect.stringContaining('Successfully processed 0 records from Excel file')
        );
    });
});
