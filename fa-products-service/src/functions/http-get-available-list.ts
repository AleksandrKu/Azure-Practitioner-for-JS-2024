import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getAllAvailableProducts } from "../database";
import { Product } from "./types";

export async function httpGetAvailableList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    try {
        const availableProducts: Product[] = await getAllAvailableProducts();

        return { body: JSON.stringify(availableProducts) };
    } catch (error) {
        context.error("Error fetching available products:", error);
        return { status: 500, body: "Internal Server Error" };
    }
};

app.http('getAvailableList', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'product/available',
    handler: httpGetAvailableList
});
