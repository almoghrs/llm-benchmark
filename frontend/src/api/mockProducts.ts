import type { Product } from "../types/Product";

/**
 * Simulates a network request returning a list of products.
 * Resolves after a short timeout to mimic latency.
 */
export function fetchProducts(): Promise<Product[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const products: Product[] = [
        {
          id: "1",
          name: "Classic White Tee",
          price: 29.99,
          image: "/placeholder.png",
        },
        {
          id: "2",
          name: "Organic Denim Jacket",
          price: 119.0,
          image: "/placeholder.png",
        },
        {
          id: "3",
          name: "Sustainable Hoodie",
          price: 79.5,
          image: "/placeholder.png",
        },
      ];
      resolve(products);
    }, 800); // 800 ms delay
  });
}
