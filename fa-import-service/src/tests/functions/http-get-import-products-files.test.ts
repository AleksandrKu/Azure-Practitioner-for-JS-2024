import { HttpRequest, InvocationContext } from "@azure/functions";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { httpGetImportProductsFiles } from "../../functions/http-get-import-products-files";

// Mock Azure Storage
jest.mock('@azure/storage-blob', () => {
    const mockBlobClient = {
        url: 'https://test.blob.core.windows.net/container/test.xlsx'
    };

    const mockContainerClient = {
        containerName: 'products-container-uploaded',
        getBlobClient: jest.fn().mockReturnValue(mockBlobClient)
    };

    return {
        BlobServiceClient: {
            fromConnectionString: jest.fn().mockReturnValue({
                getContainerClient: jest.fn().mockReturnValue(mockContainerClient)
            })
        },
        StorageSharedKeyCredential: jest.fn(),
        generateBlobSASQueryParameters: jest.fn().mockReturnValue({
            toString: () => 'mock-sas-token'
        })
    };
});

describe('httpGetImportProductsFiles', () => {
    const mockContext: any = {
        log: jest.fn(),
        error: jest.fn(),
        functionName: 'getImportProductsFiles',
        invocationId: 'test-id',
        extraInputs: [],
        extraOutputs: [],
        trace: jest.fn(),
        debug: jest.fn(),
        info: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.AzureWebJobsStorage = 'mock-connection-string';
        process.env.STORAGE_ACCOUNT_NAME = 'mock-account-name';
        process.env.STORAGE_ACCOUNT_KEY = 'mock-account-key';
    });

    it('should return 400 if filename is not provided', async () => {
        const mockRequest = {
            query: new Map()
        } as unknown as HttpRequest;

        const response = await httpGetImportProductsFiles(mockRequest, mockContext);

        expect(response.status).toBe(400);
        expect(JSON.parse(response.body as string)).toEqual({
            error: "Please provide a file name in the query parameter 'name'"
        });
    });

    // it('should return signed URL when filename is provided', async () => {
    //     const mockRequest = {
    //         query: new Map([['name', 'test.xlsx']])
    //     } as unknown as HttpRequest;

    //     const response = await httpGetImportProductsFiles(mockRequest, mockContext);

    //     expect(response.status).toBe(200);
    //     expect(JSON.parse(response.body as string)).toEqual({
    //         sasUrl: 'https://test.blob.core.windows.net/container/test.xlsx?mock-sas-token'
    //     });
    // });

    it('should return 500 if storage connection string is missing', async () => {
        process.env.AzureWebJobsStorage = '';
        
        const mockRequest = {
            query: new Map([['name', 'test.xlsx']])
        } as unknown as HttpRequest;

        const response = await httpGetImportProductsFiles(mockRequest, mockContext);

        expect(response.status).toBe(500);
        expect(JSON.parse(response.body as string)).toEqual({
            error: "Internal server error"
        });
    });

    it('should return 500 if storage credentials are missing', async () => {
        process.env.STORAGE_ACCOUNT_NAME = '';
        process.env.STORAGE_ACCOUNT_KEY = '';
        
        const mockRequest = {
            query: new Map([['name', 'test.xlsx']])
        } as unknown as HttpRequest;

        const response = await httpGetImportProductsFiles(mockRequest, mockContext);

        expect(response.status).toBe(500);
        expect(JSON.parse(response.body as string)).toEqual({
            error: "Internal server error"
        });
    });
});
