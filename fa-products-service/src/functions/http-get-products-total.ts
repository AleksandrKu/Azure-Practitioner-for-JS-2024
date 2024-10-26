import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getAllAvailableProducts } from "../database";

export async function httpGetProductsTotal(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    try {
        const availableProducts = await getAllAvailableProducts();
        const totalCount = availableProducts.reduce((sum, product) => sum + (product.count || 0), 0);

        return { 
            body: JSON.stringify({ total: totalCount }),
            headers: {
                "Content-Type": "application/json"
            }
        };
    } catch (error) {
        context.error("Error calculating total products:", error);
        return { 
            status: 500, 
            body: JSON.stringify({ error: "Internal Server Error" }),
            headers: {
                "Content-Type": "application/json"
            }
        };
    }
}

app.http('getProductsTotal', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'products/total',
    handler: httpGetProductsTotal
});
