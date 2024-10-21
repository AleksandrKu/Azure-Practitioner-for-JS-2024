import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT || "";
const key = process.env.COSMOS_KEY || "";
const databaseId = 'products-db';

export const client = new CosmosClient({ endpoint, key });
export const database = client.database(databaseId);
export const productsContainer = database.container('products');
export const stocksContainer = database.container('stocks');
