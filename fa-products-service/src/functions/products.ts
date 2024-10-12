export const products = [
    {
        "id": "1",
        "title": "Product 1",
        "description": "Description 1",
        "price": 1101
    },
    {
        "id": "2",
        "title": "Product 2",
        "description": "Description 2",
        "price": 2201
    },
    {
        "id": "3",
        "title": "Product 3",
        "description": "Description 3",
        "price": 3301
    },
    {
        "id": "4",
        "title": "Product 4",
        "description": "Description 4",
        "price": 4400
    },
    {
        "id": "5",
        "title": "Product 5",
        "description": "Description 5",
        "price": 5500
    },
    {
        "id": "6",
        "title": "Product 6",
        "description": "Description 6",
        "price": 6600
    }
];

export const availableProducts = products.map(
    (product, index) => ({ ...product, count: index + 1 })
);