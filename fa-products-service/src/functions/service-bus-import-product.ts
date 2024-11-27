import { app, InvocationContext } from "@azure/functions";
import { CosmosClient, Container } from '@azure/cosmos';

const databaseId = "products-db";
const productsContainerId = "products";
const stocksContainerId = "stocks";
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;

if (!endpoint || !key) {
  throw new Error("COSMOS_ENDPOINT or COSMOS_KEY is not set");
}
const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);
const productsContainer: Container = database.container(productsContainerId);
const stocksContainer: Container = database.container(stocksContainerId);


type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}

type Stock = {
  product_id: string;
  count: number;
}

async function populateCosmosDB(product: Product, context: InvocationContext) {
  try {
    context.log("Populating products...");
    await productsContainer.items.upsert(product);
    context.log(`Added/Updated product: ${product.id}`);


    context.log("Populating stocks...");
    const stock: Stock = {
      product_id: product.id,
      count: product.count
    };
    await stocksContainer.items.upsert(stock);

    return `Added/Updated stock for product: ${stock.product_id}`;
  } catch (error) {
    context.error("Error populating to DB:", error);
  }
}

// Azure Function to handle messages from Service Bus
export async function serviceBusQueueTrigger(message: unknown, context: InvocationContext) {
  context.log('ServiceBus queue trigger function received a message');

  try {

    context.log('Service bus queue function processed message:', message);
    context.log(message['id']);
    context.log('EnqueuedTimeUtc =', context.triggerMetadata.enqueuedTimeUtc);
    context.log('DeliveryCount =', context.triggerMetadata.deliveryCount);
    context.log('MessageId =', context.triggerMetadata.messageId);
    await populateCosmosDB(message as Product, context);
  } catch (error) {
    context.error(`Exception occurred: ${error.message}`);
  }
};

app.serviceBusQueue('serviceBusQueueTrigger', {
  connection: 'SERVICE_BUS_CONNECTION_STRING',
  queueName: 'service-bus-products-service-sand-ne-001',
  handler: serviceBusQueueTrigger
});