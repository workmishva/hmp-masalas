import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, CheckCircle2, Circle, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Product, useCart } from '../context/CartContext';
import { resolveCatalogImage } from '../context/ProductCatalogContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SelectWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const WEIGHT_OPTIONS = [
  { id: '50g', label: '50g Artisan Tin', desc: 'Perfect for sampling or gifting', multiplier: 0.35 },
  { id: '150g', label: '150g Heritage Jar', desc: 'Glass jar for daily culinary use', multiplier: 0.75 },
  { id: '250g', label: '250g Standard Pouch', desc: 'Standard refill pouch', multiplier: 1.0 },
  { id: '500g', label: '500g Bulk Pack', desc: 'Economical refill for spice enthusiasts', multiplier: 1.75 },
];

export default function SelectWeightModal({ isOpen, onClose, product }: SelectWeightModalProps) {
  const { addToCart } = useCart();
  const [selectedWeight, setSelectedWeight] = useState(WEIGHT_OPTIONS[2]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setSelectedWeight(WEIGHT_OPTIONS[2]);
      setQuantity(1);
    }
  }, [isOpen]);

  if (!product) return null;

  const currentPrice = Math.round(product.price * selectedWeight.multiplier);
  const totalPrice = currentPrice * quantity;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
        addToCart(product, selectedWeight.id, currentPrice);
    }
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[70] flex max-h-[92vh] w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2rem] bg-card shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] md:flex-row">
          
          <div className="relative h-48 w-full shrink-0 bg-muted sm:h-64 md:h-auto md:w-1/2">
            <ImageWithFallback
              src={resolveCatalogImage(product.image)}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute left-4 top-4">
              <div className="flex h-10 items-center justify-center rounded-lg bg-card/90 px-3 font-black text-primary shadow-sm backdrop-blur">
                HMP Masala
              </div>
            </div>
          </div>

          <div className="flex w-full min-h-0 flex-1 flex-col overflow-hidden bg-card md:w-1/2">
            
            <div className="shrink-0 p-6 pb-0 md:p-8 md:pb-0">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <span className="rounded-md bg-secondary/15 px-2 py-1 text-xs font-semibold uppercase tracking-widest text-secondary">
                    {product.category}
                  </span>
                  <Dialog.Title className="mt-2 text-3xl font-black text-foreground">
                    {product.name}
                  </Dialog.Title>
                </div>
                <Dialog.Close className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <X size={24} />
                </Dialog.Close>
              </div>
              
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                {product.description || 'Our signature blend of warm, aromatic spices. Hand-toasted and stone-ground in small batches to preserve volatile oils and intense flavor.'}
              </p>

              <label className="mb-3 block text-sm font-bold text-foreground">Select Weight Category</label>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 pb-6 md:px-8 md:pb-8">
              <div className="space-y-3 pt-1">
                {WEIGHT_OPTIONS.map((opt) => {
                  const isSelected = selectedWeight.id === opt.id;
                  const price = Math.round(product.price * opt.multiplier);
                  
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedWeight(opt)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/60 hover:border-primary/40 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected ? (
                          <CheckCircle2 className="text-primary" size={24} fill="currentColor" />
                        ) : (
                          <Circle className="text-border" size={24} />
                        )}
                        <div>
                          <span className="block font-bold text-foreground">{opt.label}</span>
                          <span className="text-xs text-muted-foreground">{opt.desc}</span>
                        </div>
                      </div>
                      <span className={`font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        ₹{price}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="z-10 mt-auto shrink-0 border-t border-border/60 bg-card p-6 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center rounded-full border border-border/60 px-2 py-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-10 text-center font-bold text-foreground">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart} 
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                >
                  <ShoppingBag size={20} />
                  Add to Cart — ₹{totalPrice}
                </button>
              </div>
            </div>

          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
