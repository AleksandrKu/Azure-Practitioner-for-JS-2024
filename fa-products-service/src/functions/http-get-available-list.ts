import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

import { availableProducts } from "./products";
import { AppConfigurationClient } from '@azure/app-configuration';
const connection_string = process.env.AZURE_APP_CONFIG_CONNECTION_STRING;

const client = new AppConfigurationClient(connection_string);


export async function httpGetAvailableList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Retrieve a configuration key
    const configs = await client.getConfigurationSetting({ key: 'DATA_FROM_APP_CONFIG' });
    context.log(configs);
    context.log(`Http function processed request for url "${request.url}"`);
    return { body: JSON.stringify(availableProducts) };
};

app.http('GetAvailableList', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    route: 'product/available',
    handler: httpGetAvailableList
});
