import { productsContainer, stocksContainer } from "./cosmos-client";
import { Product, Stock } from "../functions/types";

async function getAllProductsWithStock(isAvailable: boolean = false): Promise<{ products: Product[], stocks: Stock[] }> {
  const stockQuery = 
  isAvailable ? "SELECT * FROM c WHERE c.count > 0" : "SELECT * FROM c";
  const { resources: stocks } = await stocksContainer.items
    .query<Stock>(stockQuery)
    .fetchAll();

  const availableProductIds = stocks.map(stock => stock.product_id);

  const productQuery = `SELECT * FROM c WHERE ARRAY_CONTAINS(@availableIds, c.id)`;
  const querySpec = {
    query: productQuery,
    parameters: [
      {
        name: "@availableIds",
        value: availableProductIds
      }
    ]
  };

  const { resources: products } = await productsContainer.items
    .query<Product>(querySpec)
    .fetchAll();
  return { products, stocks };
}

export async function getAllAvailableProducts(): Promise<Product[]> {
  const { products, stocks } = await getAllProductsWithStock(true);
  const availableProducts: Product[] = [];
  products.forEach(product => {
    const stock = stocks.find(s => s.product_id === product.id);
    if (stock && stock.count > 0) {
    const { id, title, description, price } = product;
      availableProducts.push({
        id,
        title,
        description,
        price,
        count: stock.count
      });
    }
  });
  return availableProducts;
}

export async function getAllProducts(): Promise<Product[]> {
  const { products, stocks } = await getAllProductsWithStock(false);
  const allProducts: Product[] = [];
  products.forEach(product => {
    const stock = stocks.find(s => s.product_id === product.id);
    const { id, title, description, price } = product;
    allProducts.push({
      id,
      title,
      description,
      price,
      count: stock.count
    });
  });
  return allProducts;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const { resource } = await productsContainer.item(id, id).read<Product>();
  return resource;
}

export async function createProduct(product: Product): Promise<Product> {
  const { resource } = await productsContainer.items.create(product);
  return resource;
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product | undefined> {
  const { resource } = await productsContainer.item(id, id).replace<Product>(product as Product);
  return resource;
}

export async function deleteProduct(id: string): Promise<void> {
  await productsContainer.item(id, id).delete();
}
