import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Product } from "./types";
import { products } from "./products";

export async function httpGetProducts(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    return { body: JSON.stringify(products) };
};

app.http('products', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: httpGetProducts
});
