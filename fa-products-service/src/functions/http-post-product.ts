import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import crypto from "crypto";
import { Product } from './types';
import { createProduct } from '../database/products';
import { createStock } from '../database/stocks';

export async function httpPostCreateProduct(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
        const requestBody = await request.json() as Product;
        const { title, description, price, count } = requestBody;

        if (!title || !description || typeof price !== 'number' || typeof count !== 'number') {
            return {
                status: 400,
                body: JSON.stringify({ error: "Invalid input. Please provide title, description, price, and count." })
            };
        }

        const newProduct: Product = {
            id: crypto.randomUUID(),
            title,
            description,
            price
        };
        const createdProduct = await createProduct(newProduct);

        const stock = {
            product_id: createdProduct.id,
            count
        };
        await createStock(stock);

        return {
            status: 201,
            body: JSON.stringify({
                ...createdProduct,
                count
            })
        };
    } catch (error) {
        context.error("Error creating product:", error);
        return {
            status: 500,
            body: JSON.stringify({ error: "Internal server error" })
        };
    }
}

app.http('createProduct', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'product',
    handler: httpPostCreateProduct
});


