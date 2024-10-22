import { CosmosClient } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';
const credential = new DefaultAzureCredential();

const endpoint = process.env.COSMOS_ENDPOINT || "";
const key = process.env.COSMOS_KEY || "";
const databaseId = "products-db";
let client: CosmosClient;
if (process.env.IS_LOCAL === "true") {
    client = new CosmosClient({ endpoint, key });
} else {
    client = new CosmosClient({ endpoint, aadCredentials: credential });
}
export const database = client.database(databaseId);
export const productsContainer = database.container('products');
export const stocksContainer = database.container('stocks');
