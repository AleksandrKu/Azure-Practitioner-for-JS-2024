export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  count?: number;
}

export type Stock = { 
  product_id: string;
  count: number;
}

