import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { products } from './products';
import { Product } from './types';

export async function httpGetProductById(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const productId = request.params.productId;
    const product = products.find((product: Product) => product.id === productId);

    if (product) {
        return { body: JSON.stringify(product) };
    } else {
        return { status: 404, body: "Product not found" };
    }
}

app.http('getProductById', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'products/{productId}',
    handler: httpGetProductById
});
