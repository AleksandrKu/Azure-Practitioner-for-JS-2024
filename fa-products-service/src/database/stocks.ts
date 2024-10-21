import { stocksContainer } from "./cosmos-client";
import { Stock } from "../functions/types";

export async function getStockByProductId(productId: string): Promise<Stock | undefined> {
  const querySpec = {
    query: "SELECT * FROM c WHERE c.product_id = @productId",
    parameters: [{ name: "@productId", value: productId }]
  };
  const { resources } = await stocksContainer.items.query<Stock>(querySpec).fetchAll();
  return resources[0];
}

export async function updateStock(productId: string, count: number): Promise<Stock | undefined> {
  const stock = await getStockByProductId(productId);
  if (stock) {
    const updatedStock: Stock = { ...stock, count };
    const { resource } = await stocksContainer.item(stock.product_id, stock.product_id).replace(updatedStock);
    return resource;
  }
  return undefined;
}

export async function createStock(stock: Stock): Promise<Stock> {
  const { resource } = await stocksContainer.items.create(stock);
  return resource;
}
