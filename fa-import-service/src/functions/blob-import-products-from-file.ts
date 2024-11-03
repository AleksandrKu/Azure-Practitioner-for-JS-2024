import { app, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import * as XLSX from 'xlsx';

export async function blobImportProductsFromFile(blob: Buffer, context: InvocationContext): Promise<void> {
    try {
        console.log(context);

        context.log(
            "Blob trigger function processed blob:\n",
            `Size: ${blob.length} Bytes`
        );

        // Parse Excel content
        const workbook = XLSX.read(blob, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const records = XLSX.utils.sheet_to_json(worksheet);

        // Log each record
        records.forEach((record: any, index: number) => {
            context.log(`Record ${index + 1}:`, JSON.stringify(record));
        });

        context.log(`Successfully processed ${records.length} records from Excel file`);

        // Get blob service client
        const connectionString = process.env.AzureWebJobsStorage;
        if (!connectionString) {
            throw new Error("Storage connection string not found");
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

        console.log(context);
        // Get source container/blob details from the trigger binding context
        const sourcePath = context.triggerMetadata.blobTrigger as string;
        console.log({ sourcePath });

        const fileName = 'products-service-blob';
        console.log({ fileName });

        // Get container clients
        const sourceContainerClient = blobServiceClient.getContainerClient('products-container-uploaded');
        
        const destinationContainerClient = blobServiceClient.getContainerClient('products-container-parsed');

        // Create destination container if it doesn't exist
        await destinationContainerClient.createIfNotExists();

        // Get blob clients
        const sourceBlobClient = sourceContainerClient.getBlobClient(fileName);

        const fileDestinationName = `products-parsed-${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
        const destinationBlobClient = destinationContainerClient.getBlobClient(fileDestinationName);

        // Copy blob to destination
        const copyResult = await destinationBlobClient.beginCopyFromURL(sourceBlobClient.url);
        await copyResult.pollUntilDone();

        // Delete source blob after successful copy
        await sourceBlobClient.delete();

        context.log(`File ${fileName} successfully moved to parsed container`);
    } catch (error) {
        context.error("Error processing Excel file:", error);
        throw error;
    }
}

app.storageBlob('importProductsFromFile', {
    path: 'products-container-uploaded/products-service-blob',
    connection: 'AzureWebJobsStorage',
    handler: blobImportProductsFromFile
});
