import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobSASPermissions, BlobServiceClient, SASProtocol, StorageSharedKeyCredential, generateBlobSASQueryParameters } from "@azure/storage-blob";

/**
 * Generates a SAS token for uploading a file to Blob Storage.
 * @param containerName - The name of the container.
 * @param blobName - The name of the blob.
 * @param sharedKeyCredential - The shared key credential.
 * @param startsOn - Token start time.
 * @param expiresOn - Token expiry time.
 * @returns SAS token as a string.
 */
function generateSasToken(
    containerName: string,
    blobName: string,
    sharedKeyCredential: StorageSharedKeyCredential,
    startsOn: Date,
    expiresOn: Date
): string {
    const sasOptions = {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("racw"), // Read, Add, Create, Write
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https
    };
    //https://learn.microsoft.com/en-us/javascript/api/preview-docs/%40azure/storage-blob/?view=az-js-storage-v12
    return generateBlobSASQueryParameters(
        sasOptions,
        sharedKeyCredential
    ).toString();
}

export async function httpGetImportProductsFiles(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const fileName = request.query.get('name');
    if (!fileName) {
        context.log("File name not provided in query parameters.");
        return { 
            status: 400, 
            body: JSON.stringify({ error: "Please provide a file name in the query parameter 'name'" }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }

    try {
        const connectionString = process.env.AzureWebJobsStorage;
        if (!connectionString) {
            throw new Error("Storage connection string not found in environment variables.");
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient("products-container-uploaded");
        const blobClient = containerClient.getBlobClient(fileName);

        // Generate SAS token
        const startsOn = new Date();
        const expiresOn = new Date(startsOn);
        expiresOn.setMinutes(startsOn.getMinutes() + 15); // Token valid for 15 minutes

        const accountName = process.env.STORAGE_ACCOUNT_NAME;
        const accountKey = process.env.STORAGE_ACCOUNT_KEY;

        if (!accountName || !accountKey) {
            throw new Error("Storage account credentials (STORAGE_ACCOUNT_NAME or STORAGE_ACCOUNT_KEY) not found in environment variables.");
        }

        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
        
        const sasToken = generateSasToken(
            containerClient.containerName,
            fileName,
            sharedKeyCredential,
            startsOn,
            expiresOn
        );

        context.log(`SAS token generated successfully for blob: ${fileName}`);

        return { 
            status: 200,
            body: JSON.stringify({
                sasUrl: `${blobClient.url}?${sasToken}`
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } catch (error) {
        context.error("Error generating SAS token:", error);
        return { 
            status: 500, 
            body: JSON.stringify({ error: "Internal server error" }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }
}

app.http('getImportProductsFiles', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'import',
    handler: httpGetImportProductsFiles
});
