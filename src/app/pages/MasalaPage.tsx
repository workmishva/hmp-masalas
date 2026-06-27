import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Star, Filter, Leaf, Bone } from 'lucide-react';
import { useCart, Product } from '../context/CartContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { resolveCatalogImage, useProductCatalog } from '../context/ProductCatalogContext';
import SelectWeightModal from '../components/SelectWeightModal';

export default function MasalaPage() {
  const [filter, setFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { products } = useProductCatalog();
  const productsSectionRef = useRef<HTMLDivElement | null>(null);

  const filteredMasalas = products.filter((product) => {
    const matchesFilter = filter === 'all' ? true : product.category === filter;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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

      <div className="sticky top-20 z-40 border-b border-border bg-card/80 px-4 py-4 shadow-sm backdrop-blur-md">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
          
          <div className="relative w-full max-w-md md:mr-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg className="w-5 h-5 text-muted-foreground" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full p-3 pl-12 pr-10 text-sm text-foreground bg-muted border border-border rounded-full focus:ring-secondary focus:border-secondary outline-none transition-all"
              placeholder="Search masalas by name..."
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground"
              >
                <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
              </button>
            )}
          </div>

          <div className="flex w-full md:w-auto items-center overflow-x-auto pb-1 md:pb-0 hide-scrollbar justify-start md:justify-end">
            <div className="flex rounded-full bg-muted p-1 shrink-0">
              <button
                onClick={() => handleFilterChange('all')}
                className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
                  filter === 'all' ? 'bg-secondary text-neutral-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange('veg')}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all ${
                  filter === 'veg' ? 'bg-accent text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Leaf size={14} /> Veg
              </button>
              <button
                onClick={() => handleFilterChange('non-veg')}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all ${
                  filter === 'non-veg' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Bone size={14} /> Non-Veg
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref={productsSectionRef} className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filteredMasalas.length === 0 ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full py-20 flex flex-col items-center justify-center text-center"
              >
                <div className="w-24 h-24 mb-6 text-muted-foreground/30">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.71 20.29l-4.88-4.88C18.44 13.9 19 12.03 19 10c0-4.96-4.04-9-9-9s-9 4.04-9 9 4.04 9 9 9c2.03 0 3.9-.56 5.41-1.49l4.88 4.88c.39.39 1.02.39 1.41 0 .38-.39.38-1.03 0-1.42zM4 10c0-3.86 3.14-7 7-7s7 3.14 7 7-3.14 7-7 7-7-3.14-7-7z"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">No masalas found</h3>
                <p className="text-muted-foreground max-w-md">
                  We couldn't find any masalas matching "{searchQuery}". Try adjusting your search or filters.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setFilter('all'); }}
                  className="mt-6 px-6 py-2 rounded-full border border-border hover:bg-muted font-semibold transition-colors"
                >
                  Clear all filters
                </button>
              </motion.div>
            ) : (
              filteredMasalas.map((product) => {
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
              })
            )}
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
