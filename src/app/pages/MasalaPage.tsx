import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Star, Filter, Leaf, Bone } from 'lucide-react';
import { useCart, Product } from '../context/CartContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { resolveCatalogImage, useProductCatalog } from '../context/ProductCatalogContext';
import SelectWeightModal from '../components/SelectWeightModal';

export default function MasalaPage() {
  const [filter, setFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { products } = useProductCatalog();
  const productsSectionRef = useRef<HTMLDivElement | null>(null);

  const filteredMasalas = products.filter((product) => (filter === 'all' ? true : product.category === filter));

  const handleFilterChange = (nextFilter: 'all' | 'veg' | 'non-veg') => {
    setFilter(nextFilter);

    // Keep filter navigation predictable: always jump to product grid top.
    requestAnimationFrame(() => {
      if (!productsSectionRef.current) {
        return;
      }
      const targetTop = productsSectionRef.current.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <section className="bg-neutral px-6 py-20 text-neutral-foreground">
        <div className="container mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-5xl font-black md:text-6xl"
          >
            Explore Our <span className="text-secondary">Masala Library</span>
          </motion.h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-foreground/70">
            From the bustling streets of Mumbai to the royal kitchens of Lucknow, discover every spice blend your
            Indian kitchen ever needs.
          </p>
        </div>
      </section>

      <div className="sticky top-20 z-40 border-b border-border bg-card/80 px-6 py-6 shadow-sm backdrop-blur-md">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <Filter size={20} className="text-muted-foreground" />
            <span className="font-bold text-foreground">Filter by Category:</span>
          </div>

          <div className="flex rounded-full bg-muted p-1">
            <button
              onClick={() => handleFilterChange('all')}
              className={`rounded-full px-8 py-2 font-bold transition-all ${
                filter === 'all' ? 'bg-secondary text-neutral-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Masalas
            </button>
            <button
              onClick={() => handleFilterChange('veg')}
              className={`flex items-center gap-2 rounded-full px-8 py-2 font-bold transition-all ${
                filter === 'veg' ? 'bg-accent text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Leaf size={16} /> Vegetarian
            </button>
            <button
              onClick={() => handleFilterChange('non-veg')}
              className={`flex items-center gap-2 rounded-full px-8 py-2 font-bold transition-all ${
                filter === 'non-veg' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bone size={16} /> Non-Veg
            </button>
          </div>
        </div>
      </div>

      <div ref={productsSectionRef} className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filteredMasalas.map((product) => {
              const displayProduct = { ...product, image: resolveCatalogImage(product.image) };

              return (
                <motion.div
                  layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all duration-300 hover:shadow-2xl"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={displayProduct.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute left-4 top-4">
                    {product.category === 'veg' ? (
                      <div className="rounded-full bg-accent p-2 text-white shadow-lg" title="Vegetarian">
                        <Leaf size={16} />
                      </div>
                    ) : (
                      <div className="rounded-full bg-primary p-2 text-white shadow-lg" title="Non-Vegetarian">
                        <Bone size={16} />
                      </div>
                    )}
                  </div>
                  <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-card/90 px-3 py-1 text-xs font-bold text-foreground backdrop-blur-sm">
                    <Star size={12} className="fill-secondary text-secondary" />
                    4.9
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h4 className="mb-2 text-xl font-bold text-foreground">{product.name}</h4>
                  <p className="mb-6 flex-1 text-sm text-muted-foreground">{product.description}</p>

                  <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                    <span className="text-xl font-black text-primary">
                      ₹ {product.price}
                    </span>
                    <button
                      onClick={() => setSelectedProduct(displayProduct)}
                      className="flex items-center gap-2 rounded-full bg-neutral px-4 py-2 text-white shadow-md transition-colors active:scale-95 hover:bg-primary"
                    >
                      <ShoppingCart size={16} />
                      Add
                    </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      <SelectWeightModal 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        product={selectedProduct} 
      />
    </div>
  );
}
