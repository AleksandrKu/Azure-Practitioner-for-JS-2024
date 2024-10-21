import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getAllProducts } from "../database";
import { Product } from "./types";

export async function httpGetProducts(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    try {
        const products: Product[] = await getAllProducts();
        return { body: JSON.stringify(products) };
    } catch (error) {
        context.error("Error fetching products:", error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('products', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: httpGetProducts
});
