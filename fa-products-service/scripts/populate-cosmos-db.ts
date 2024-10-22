import { CosmosClient } from "@azure/cosmos";
import { AppConfigurationClient } from '@azure/app-configuration';
import { faker } from '@faker-js/faker';
import settings from '../local.settings.json';

const connection_string = settings.Values.AZURE_APP_CONFIG_CONNECTION_STRING;
const databaseId = "products-db";
const productsContainerId = "products";
const stocksContainerId = "stocks";

function createRandomProduct() {
  return {
    id: faker.string.uuid(),
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price()),
  };
}

function createRandomProducts(number = 6) {
  const products = [];
  for (let i = 0; i < number; i++) {
    products.push(createRandomProduct());
  }
  return products;
}

function createRandomStock(product_id: string) {
  return {
    product_id: product_id,
    count: faker.number.int({ min: 0, max: 100 }),
  };
}

const products = createRandomProducts(6);
const stocks = products.map((product) => createRandomStock(product.id));

async function populateCosmosDB() {
  try {
    const configClient = new AppConfigurationClient(connection_string);
    const cosmosEndpoint = await configClient.getConfigurationSetting({ key: 'COSMOS_ENDPOINT' });
    const cosmosKey = await configClient.getConfigurationSetting({ key: 'COSMOS_KEY' });

    // Cosmos DB configuration
    const endpoint = cosmosEndpoint.value;
    const key = cosmosKey.value;
    if (!endpoint || !key) {
      throw new Error("COSMOS_ENDPOINT or COSMOS_KEY is not set");
    }

    const client = new CosmosClient({ endpoint, key });

    const database = client.database(databaseId);
    const productsContainer = database.container(productsContainerId);
    const stocksContainer = database.container(stocksContainerId);

    console.log("Populating products...");
    for (const product of products) {
      await productsContainer.items.upsert(product);
      console.log(`Added/Updated product: ${product.id}`);
    }

    console.log("Populating stocks...");
    for (const stock of stocks) {
      await stocksContainer.items.upsert(stock);
      console.log(`Added/Updated stock for product: ${stock.product_id}`);
    }

    console.log("Finished populating Cosmos DB");
  } catch (error) {
    console.error("Error populating Cosmos DB:", error);
  }
}

populateCosmosDB();
