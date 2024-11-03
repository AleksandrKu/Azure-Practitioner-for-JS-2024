import { app, InvocationContext } from "@azure/functions";
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
    } catch (error) {
        context.error("Error processing Excel file:", error);
        throw error; // Rethrowing to ensure the function fails properly
    }
}

app.storageBlob('importProductsFromFile', {
    path: 'products-container-uploaded/products-service-blob',
    connection: 'AzureWebJobsStorage',
    handler: blobImportProductsFromFile
});
