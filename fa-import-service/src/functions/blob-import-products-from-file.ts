import { app, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { ServiceBusClient, ServiceBusSender } from "@azure/service-bus";
import * as XLSX from 'xlsx';

type Product = {
    id: string;
    title: string;
    description: string;
    price: number;
    count: number;
};

export async function blobImportProductsFromFile(blob: Buffer, context: InvocationContext): Promise<void> {

    context.log(
        "Blob trigger function processed blob:\n",
        `Size: ${blob.length} Bytes`
    );

    // Parse Excel content
    const workbook = XLSX.read(blob, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const products: Product[] = XLSX.utils.sheet_to_json(worksheet);

    let sender: ServiceBusSender;
    let sbClient: ServiceBusClient;
    try {
        const serviceBusConnectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
        context.log({ serviceBusConnectionString });
        if (!serviceBusConnectionString) {
            throw new Error("Service Bus connection string not found");
        }

        // Send message to Service Bus queue
        sbClient = new ServiceBusClient(serviceBusConnectionString);
        sender = sbClient.createSender("service-bus-products-service-sand-ne-001");
    } catch (error) {
        context.error("Error sending product to Service Bus:", error);
        throw error;
    }
    try {
        for (const product of products) {
            try {
                await sender.sendMessages({
                    body: product,
                    contentType: "application/json"
                });
                context.log(`Sent product ${product.id} to Service Bus queue`);
            } catch (error) {
                context.error(`Error sending product ${product.id} to Service Bus:`, error);
                throw error;
            }
        }
        await sender.close();
        await sbClient.close();

        context.log(`Successfully processed ${products.length} records from Excel file`);
    } catch (error) {
        context.error("Error sending products to Service Bus:", error);
        throw error;
    }

    try {
        // Get blob service client
        const connectionString = process.env.AzureWebJobsStorage;
        if (!connectionString) {
            throw new Error("Storage connection string not found");
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

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
        context.error("Error moving file to parsed container:", error);
        throw error;
    }
}

app.storageBlob('importProductsFromFile', {
    path: 'products-container-uploaded/products-service-blob',
    connection: 'AzureWebJobsStorage',
    handler: blobImportProductsFromFile
});
