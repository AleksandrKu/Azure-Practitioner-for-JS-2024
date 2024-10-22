import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Product, Stock } from './types';
import { getProductById } from '../database';
import { getStockByProductId } from '../database';

export async function httpGetProductById(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    try {
        const { productId } = request.params;
        const product: Product | undefined = await getProductById(productId);
        const stock: Stock | undefined = await getStockByProductId(productId);
        if (product) {
            const { id, title, description, price } = product;
            return { body: JSON.stringify({
                id,
                    title,
                    description,    
                    price,
                    count: stock ? stock.count : 0
            }) };
        } else {
            return { status: 404, body: "Product not found" };
            }
    } catch (error) {
        context.error("Error fetching product:", error);
        return { status: 500, body: "Internal server error" };
    }
}

app.http('getProductById', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'product/{productId}',
    handler: httpGetProductById
});
