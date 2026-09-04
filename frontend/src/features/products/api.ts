import { api, useMocks } from "@/lib/api-client";
import type { Product } from "@/types/api";
import type { PagedResult, QueryParams } from "@/types/common";

export interface ProductInput {
  name: string;
  category: string;
  sku: string;
  flavorOrSize?: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  description?: string;
  isActive?: boolean;
}

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    name: "Optimum Nutrition Gold Standard 100% Whey",
    category: "Protein",
    sku: "ON-WHEY-CHOC-2KG",
    flavorOrSize: "Double Rich Chocolate · 2.27kg (74 Servings)",
    unitPrice: 3200,
    costPrice: 2400,
    stockQuantity: 120,
    lowStockThreshold: 15,
    description: "World's #1 selling whey protein isolate powder for post-workout muscle recovery.",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-2",
    name: "Dymatize ISO100 Hydrolyzed Whey Isolate",
    category: "Protein",
    sku: "DYM-ISO100-VAN-2KG",
    flavorOrSize: "Gourmet Vanilla · 2.3kg (76 Servings)",
    unitPrice: 3900,
    costPrice: 3000,
    stockQuantity: 45,
    lowStockThreshold: 10,
    description: "Ultra-fast absorbing hydrolyzed 100% whey protein isolate with zero fat and zero sugar.",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-3",
    name: "MuscleTech Platinum 100% Creatine Monohydrate",
    category: "Creatine",
    sku: "MT-CREATINE-400G",
    flavorOrSize: "Unflavored · 400g (80 Servings)",
    unitPrice: 1100,
    costPrice: 750,
    stockQuantity: 85,
    lowStockThreshold: 20,
    description: "HPLC-tested pure micronized creatine monohydrate for lean muscle, ATP power, and strength.",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-4",
    name: "Cellucor C4 Original Pre-Workout",
    category: "Pre-Workout",
    sku: "CEL-C4-BLUE-30SERV",
    flavorOrSize: "Icy Blue Razz · 30 Servings (180g)",
    unitPrice: 1450,
    costPrice: 950,
    stockQuantity: 60,
    lowStockThreshold: 12,
    description: "Explosive energy pre-workout supplement with CarnoSyn Beta-Alanine and Caffeine.",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-5",
    name: "Scivation Xtend Original BCAA Formula",
    category: "Amino & BCAAs",
    sku: "XTEND-BCAA-WMELON-90",
    flavorOrSize: "Watermelon Explosion · 90 Servings (1.2kg)",
    unitPrice: 2100,
    costPrice: 1500,
    stockQuantity: 35,
    lowStockThreshold: 10,
    description: "7g of 2:1:1 BCAAs with hydrating electrolytes for intra-workout endurance.",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-6",
    name: "Optimum Nutrition Serious Mass High-Calorie Gainer",
    category: "Mass Gainer",
    sku: "ON-SMASS-CHOC-5KG",
    flavorOrSize: "Chocolate · 5.44kg (16 Huge Servings)",
    unitPrice: 3600,
    costPrice: 2700,
    stockQuantity: 25,
    lowStockThreshold: 8,
    description: "1,250 calories and 50g of protein per serving for serious mass, bulk, and strength gains.",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-7",
    name: "Universal Nutrition Animal Pak Performance Multivitamin",
    category: "Vitamins & Health",
    sku: "ANIMAL-PAK-44PK",
    flavorOrSize: "44 Training Packs",
    unitPrice: 1850,
    costPrice: 1300,
    stockQuantity: 40,
    lowStockThreshold: 10,
    description: "The ultimate foundation training pack loaded with 85+ nutrients, amino acids, and digestive enzymes.",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function getProducts(params: QueryParams & { category?: string } = {}): Promise<PagedResult<Product>> {
  if (useMocks) {
    let filtered = [...mockProducts];
    if (params.category && params.category !== "All") {
      filtered = filtered.filter((p) => p.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.category.toLowerCase().includes(s) ||
          p.sku.toLowerCase().includes(s) ||
          (p.flavorOrSize && p.flavorOrSize.toLowerCase().includes(s)),
      );
    }
    return {
      items: filtered,
      total: filtered.length,
      page: 1,
      pageSize: params.pageSize ?? 50,
    };
  }

  const response = await api.get<PagedResult<Product>>("/products", { params });
  return response.data;
}

export async function getProduct(id: string): Promise<Product> {
  if (useMocks) {
    const prod = mockProducts.find((p) => p.id === id);
    if (!prod) throw new Error("Product not found");
    return prod;
  }
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  if (useMocks) {
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: input.name,
      category: input.category,
      sku: input.sku,
      flavorOrSize: input.flavorOrSize,
      unitPrice: input.unitPrice,
      costPrice: input.costPrice,
      stockQuantity: input.stockQuantity,
      lowStockThreshold: input.lowStockThreshold ?? 10,
      description: input.description,
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockProducts.unshift(newProd);
    return newProd;
  }
  const response = await api.post<Product>("/products", input);
  return response.data;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  if (useMocks) {
    const index = mockProducts.findIndex((p) => p.id === id);
    if (index !== -1) {
      mockProducts[index] = { ...mockProducts[index], ...input, updatedAt: new Date().toISOString() };
      return mockProducts[index];
    }
    throw new Error("Product not found");
  }
  const response = await api.put<Product>(`/products/${id}`, input);
  return response.data;
}

export async function deleteProduct(id: string): Promise<void> {
  if (useMocks) {
    const index = mockProducts.findIndex((p) => p.id === id);
    if (index !== -1) {
      mockProducts.splice(index, 1);
    }
    return;
  }
  await api.delete(`/products/${id}`);
}
