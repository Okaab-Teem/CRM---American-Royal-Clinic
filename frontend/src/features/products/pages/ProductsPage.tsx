import { useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableShell } from "@/components/shared/DataTable";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/features/products/hooks";
import { formatMoney } from "@/lib/formatters";
import { useToast } from "@/components/shared/toast";
import type { Product } from "@/types/api";

const CATEGORIES = [
  "All",
  "Protein",
  "Creatine",
  "Pre-Workout",
  "Amino & BCAAs",
  "Mass Gainer",
  "Vitamins & Health",
] as const;

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Protein");
  const [sku, setSku] = useState("");
  const [flavorOrSize, setFlavorOrSize] = useState("");
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [stockQuantity, setStockQuantity] = useState<number | "">("");
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [description, setDescription] = useState("");

  const { showToast } = useToast();
  const productsQuery = useProducts({ search, category: selectedCategory, pageSize: 100 });
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const products = productsQuery.data?.items ?? [];

  // Summary Metrics
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const totalCatalogValue = products.reduce((sum, p) => sum + p.unitPrice * p.stockQuantity, 0);
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.lowStockThreshold).length;

  function openCreateModal() {
    setEditingProduct(null);
    setName("");
    setCategory("Protein");
    setSku("");
    setFlavorOrSize("");
    setUnitPrice("");
    setCostPrice("");
    setStockQuantity("");
    setLowStockThreshold(10);
    setDescription("");
    setIsModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setSku(product.sku);
    setFlavorOrSize(product.flavorOrSize || "");
    setUnitPrice(product.unitPrice);
    setCostPrice(product.costPrice);
    setStockQuantity(product.stockQuantity);
    setLowStockThreshold(product.lowStockThreshold);
    setDescription(product.description || "");
    setIsModalOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || unitPrice === "" || costPrice === "" || stockQuantity === "") {
      showToast("Please fill in all required product fields.", "error");
      return;
    }

    const payload = {
      name: name.trim(),
      category: category.trim(),
      sku: sku.trim().toUpperCase(),
      flavorOrSize: flavorOrSize.trim() || undefined,
      unitPrice: Number(unitPrice),
      costPrice: Number(costPrice),
      stockQuantity: Number(stockQuantity),
      lowStockThreshold: Number(lowStockThreshold),
      description: description.trim() || undefined,
      isActive: true,
    };

    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({ id: editingProduct.id, input: payload });
        showToast("Supplement product updated successfully.", "success");
      } else {
        await createProductMutation.mutateAsync(payload);
        showToast("New supplement product added to inventory.", "success");
      }
      setIsModalOpen(false);
    } catch {
      showToast("Failed to save product. Please ensure SKU is unique.", "error");
    }
  }

  async function handleDelete(id: string, productName: string) {
    if (window.confirm(`Are you sure you want to remove "${productName}" from the catalog?`)) {
      try {
        await deleteProductMutation.mutateAsync(id);
        showToast("Product removed successfully.", "success");
      } catch {
        showToast("Failed to remove product.", "error");
      }
    }
  }

  const isSubmitting = createProductMutation.isPending || updateProductMutation.isPending;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Supplements & Products"
        description="Manage your sports nutrition inventory, wholesale pricing, cost margins, and warehouse stock levels."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        }
      />

      {/* KPI Ribbons */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Catalog SKUs</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold">{totalProducts}</span>
            <span className="text-xs text-muted-foreground font-medium">Active Products</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inventory Units</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold">{totalStockUnits.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground font-medium">In Warehouse</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Stock Value</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatMoney(totalCatalogValue)}
            </span>
            <span className="text-xs text-muted-foreground font-medium">Retail Value</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stock Alerts</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600"}`}>
              {lowStockCount}
            </span>
            <span className="text-xs text-muted-foreground font-medium">Low or Re-order</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative min-w-[280px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supplements by name, SKU, or flavor..."
            className="w-full rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Supplements Table */}
      <DataTableShell>
        <Table>
          <thead>
            <tr>
              <Th>Supplement / Product</Th>
              <Th>Category</Th>
              <Th>SKU</Th>
              <Th>Stock Status</Th>
              <Th>Unit Price</Th>
              <Th>Cost</Th>
              <Th>Margin %</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <Td colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Package className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  No supplement products found matching your filters.
                </Td>
              </tr>
            ) : (
              products.map((product) => {
                const marginPercent =
                  product.unitPrice > 0
                    ? Math.round(((product.unitPrice - product.costPrice) / product.unitPrice) * 100)
                    : 0;

                const isOutOfStock = product.stockQuantity <= 0;
                const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold;

                return (
                  <tr key={product.id}>
                    <Td>
                      <div className="font-semibold text-foreground">{product.name}</div>
                      {product.flavorOrSize ? (
                        <div className="text-xs text-muted-foreground mt-0.5">{product.flavorOrSize}</div>
                      ) : null}
                    </Td>
                    <Td>
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {product.category}
                      </span>
                    </Td>
                    <Td className="font-mono text-xs text-muted-foreground">{product.sku}</Td>
                    <Td>
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-300">
                          <AlertTriangle className="h-3 w-3" /> Out of Stock (0)
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <AlertTriangle className="h-3 w-3" /> Low Stock ({product.stockQuantity})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle className="h-3 w-3" /> In Stock ({product.stockQuantity})
                        </span>
                      )}
                    </Td>
                    <Td className="font-semibold text-foreground">{formatMoney(product.unitPrice)}</Td>
                    <Td className="text-muted-foreground">{formatMoney(product.costPrice)}</Td>
                    <Td>
                      <span
                        className={`font-semibold text-xs ${
                          marginPercent >= 25 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                        }`}
                      >
                        {marginPercent}%
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                          title="Edit Supplement"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </DataTableShell>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingProduct ? "Edit Supplement Product" : "Add New Supplement Product"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure wholesale specs, pricing, and warehouse threshold.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Product / Supplement Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Optimum Nutrition Gold Standard 100% Whey"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Protein">Protein</option>
                    <option value="Creatine">Creatine</option>
                    <option value="Pre-Workout">Pre-Workout</option>
                    <option value="Amino & BCAAs">Amino & BCAAs</option>
                    <option value="Mass Gainer">Mass Gainer</option>
                    <option value="Vitamins & Health">Vitamins & Health</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="ON-WHEY-CHOC-2KG"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Flavor & Size / Servings
                  </label>
                  <input
                    type="text"
                    value={flavorOrSize}
                    onChange={(e) => setFlavorOrSize(e.target.value)}
                    placeholder="e.g. Double Rich Chocolate · 2.27kg (74 Servings)"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Selling Price (Unit Price) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="3200"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Cost Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="2400"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Warehouse Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="100"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    placeholder="10"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Key benefits, product ingredients, or supplier notes..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
