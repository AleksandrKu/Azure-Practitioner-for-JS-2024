import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

import { availableProducts } from "./products";

export async function httpGetAvailableList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    return { body: JSON.stringify(availableProducts) };
};

app.http('GetAvailableList', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    route: 'product/available',
    handler: httpGetAvailableList
});
