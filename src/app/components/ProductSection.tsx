import { ReactNode, useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { resolveCatalogImage, useProductCatalog } from '../context/ProductCatalogContext';
import SelectWeightModal from './SelectWeightModal';
import { Product } from '../context/CartContext';

export default function ProductSection() {
  const { featuredProducts } = useProductCatalog();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <section id="products" className="bg-background py-24">
      <div className="container mx-auto px-6 md:px-12">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-secondary">
              Our Bestsellers
            </h2>
            <h3 className="mb-6 text-4xl font-black text-foreground md:text-5xl">
              Essential Kitchen Spices
            </h3>
            <p className="text-lg text-muted-foreground">
              Bring authentic flavors to your meals with HMP Masala&apos;s premium, preservative-free spice blends.
              Freshly ground, richly aromatic.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product, index) => {
            const displayProduct = { ...product, image: resolveCatalogImage(product.image) };

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={displayProduct.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-card/90 px-3 py-1 text-xs font-bold text-foreground shadow-sm backdrop-blur-sm">
                    <Star size={12} className="fill-secondary text-secondary" />
                    4.9
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className="text-xl font-bold leading-tight text-foreground">{product.name}</h4>
                  </div>
                  <p className="mb-6 flex-1 text-sm text-muted-foreground">{product.description}</p>

                  <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Price</span>
                      <span className="text-xl font-black text-primary">
                        ₹ {product.price}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedProduct(displayProduct)}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral text-white shadow-md transition-colors active:scale-95 hover:bg-primary"
                    >
                      <ShoppingCart size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <SelectWeightModal 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        product={selectedProduct} 
      />
    </section>
  );
}
