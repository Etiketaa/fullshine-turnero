"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Package,
  AlertTriangle
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  unit: "unit" | "liter" | "kg" | "ml";
  is_active: boolean;
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name: "",
    description: "",
    category: "",
    brand: "",
    purchase_price: 0,
    sale_price: 0,
    stock: 0,
    min_stock: 0,
    unit: "unit",
    is_active: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");
    
    if (data) setProducts(data);
    setLoading(false);
  }

  async function handleSave() {
    try {
      if (currentProduct.id) {
        const { error } = await supabase
          .from("products")
          .update(currentProduct)
          .eq("id", currentProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("products")
          .insert([currentProduct]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error al guardar el producto.");
    }
  }

  async function handleDelete() {
    if (!productToDelete) return;
    
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productToDelete.id);
    
    if (!error) {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } else {
      alert("Error al eliminar el producto.");
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const lowStockProducts = products.filter(p => p.stock <= p.min_stock);

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case "unit": return "Unidad";
      case "liter": return "Litro";
      case "kg": return "Kg";
      case "ml": return "ml";
      default: return unit;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-gray-400">Gestioná el inventario de productos del taller.</p>
        </div>
        <button 
          onClick={() => {
            setCurrentProduct({
              name: "",
              description: "",
              category: "",
              brand: "",
              purchase_price: 0,
              sale_price: 0,
              stock: 0,
              min_stock: 0,
              unit: "unit",
              is_active: true,
            });
            setIsModalOpen(true);
          }}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-500 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-yellow-500 font-bold">
              {lowStockProducts.length} producto(s) con stock bajo
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, marca o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Products List */}
      <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-gray-500 border-b border-white/5">
                <th className="px-6 py-4 font-bold">Producto</th>
                <th className="px-6 py-4 font-bold">Categoría</th>
                <th className="px-6 py-4 font-bold">Stock</th>
                <th className="px-6 py-4 font-bold">Precio Compra</th>
                <th className="px-6 py-4 font-bold">Precio Venta</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-16 bg-white/[0.02]" />
                  </tr>
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.brand}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {product.category || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "font-bold",
                        product.stock <= product.min_stock ? "text-yellow-500" : "text-white"
                      )}>
                        {product.stock} {getUnitLabel(product.unit)}
                      </span>
                      {product.stock <= product.min_stock && (
                        <span className="ml-2 text-xs text-yellow-500">(bajo)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatCurrency(product.purchase_price)}
                    </td>
                    <td className="px-6 py-4 font-bold text-red-500">
                      {formatCurrency(product.sale_price)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setCurrentProduct(product);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setProductToDelete(product);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                    No hay productos registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for editing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-zinc-900 border-l border-white/5 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">{currentProduct.id ? "Editar" : "Nuevo"} Producto</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Nombre</label>
                <input 
                  type="text" 
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  placeholder="Ej: Shampoo Premium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Marca</label>
                  <input 
                    type="text" 
                    value={currentProduct.brand}
                    onChange={(e) => setCurrentProduct({...currentProduct, brand: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="Ej: Meguiars"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Categoría</label>
                  <input 
                    type="text" 
                    value={currentProduct.category}
                    onChange={(e) => setCurrentProduct({...currentProduct, category: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="Ej: Limpieza"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Precio Compra</label>
                  <input 
                    type="number" 
                    value={currentProduct.purchase_price}
                    onChange={(e) => setCurrentProduct({...currentProduct, purchase_price: Number(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Precio Venta</label>
                  <input 
                    type="number" 
                    value={currentProduct.sale_price}
                    onChange={(e) => setCurrentProduct({...currentProduct, sale_price: Number(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Stock</label>
                  <input 
                    type="number" 
                    value={currentProduct.stock}
                    onChange={(e) => setCurrentProduct({...currentProduct, stock: Number(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Stock Mínimo</label>
                  <input 
                    type="number" 
                    value={currentProduct.min_stock}
                    onChange={(e) => setCurrentProduct({...currentProduct, min_stock: Number(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Unidad</label>
                  <select
                    value={currentProduct.unit}
                    onChange={(e) => setCurrentProduct({...currentProduct, unit: e.target.value as any})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                  >
                    <option value="unit">Unidad</option>
                    <option value="liter">Litro</option>
                    <option value="kg">Kg</option>
                    <option value="ml">ml</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-500">Descripción</label>
                <textarea 
                  rows={3}
                  value={currentProduct.description}
                  onChange={(e) => setCurrentProduct({...currentProduct, description: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-red-500 outline-none resize-none"
                  placeholder="Detalles del producto..."
                />
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleSave}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold">Eliminar Producto</h3>
            </div>
            <p className="text-gray-400">
              ¿Estás seguro de que deseas eliminar <span className="text-white font-bold">{productToDelete.name}</span>? 
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
