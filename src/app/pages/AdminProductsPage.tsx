import React, { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { PlusCircle, RotateCcw, Trash2, Search, X, Upload } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { CatalogProduct, ProductCategory, resolveCatalogImage, useProductCatalog } from '../context/ProductCatalogContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner';
import { showErrorToast } from '../utils/errorHandler';

type ProductDraft = Omit<CatalogProduct, 'id'>;

const emptyDraft: ProductDraft = {
  name: '',
  price: 0,
  image: '',
  description: '',
  category: 'veg',
  featured: false,
  taxPercent: 5,
};

export default function AdminProductsPage() {
  const { products, addProduct, updateProduct, removeProduct, resetProducts } = useProductCatalog();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Model state: 'NEW' means adding a product, else editing an existing product
  const [activeModal, setActiveModal] = useState<'NEW' | CatalogProduct | null>(null);

  // Draft state for either new or being added
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  
  const assetHints = useMemo(
    () => ['garam_masala.jpg', 'chilli.jpg', 'turmeric_upside.jpg', 'masala.jpg', 'pavbhaji.jpg', 'kashmiri-brand.jpeg'],
    []
  );

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showErrorToast('File Too Large', 'Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setDraft(prev => ({ ...prev, image: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openNewModal = () => {
    setDraft(emptyDraft);
    setActiveModal('NEW');
  };

  const openEditModal = (product: CatalogProduct) => {
    // initialize draft with existing product values
    setDraft({
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.description,
      category: product.category,
      featured: product.featured,
      taxPercent: product.taxPercent ?? 5,
    });
    setActiveModal(product);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleDraftChange =
    (field: keyof ProductDraft) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value =
        (field === 'price' || field === 'taxPercent')
          ? Number(event.target.value)
          : field === 'featured'
            ? (event.target as HTMLInputElement).checked
            : event.target.value;
      setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
    };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim() || draft.price <= 0) return;

    if (activeModal === 'NEW') {
      addProduct({
        ...draft,
        name: draft.name.trim(),
        image: draft.image.trim(),
        description: draft.description.trim(),
        category: draft.category as ProductCategory,
      });
    } else if (activeModal) {
      updateProduct(activeModal.id, {
        ...draft,
        name: draft.name.trim(),
        image: draft.image.trim(),
        description: draft.description.trim(),
        category: draft.category as ProductCategory,
        taxPercent: draft.taxPercent ?? 5,
      });
    }
    closeModal();
  };

  const handleDelete = () => {
    if (activeModal && activeModal !== 'NEW') {
      removeProduct(activeModal.id);
      closeModal();
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white sm:text-4xl">Product Management</h1>
          <p className="mt-2 text-primary-foreground/70">Click a card to edit it or add new inventory.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetProducts}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-5 py-2 font-semibold text-foreground backdrop-blur transition hover:bg-secondary/20"
          >
            <RotateCcw size={16} />
            Reset defaults
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search masalas..."
              className="w-full rounded-full border border-border bg-card/85 pl-12 pr-4 py-3 text-sm outline-none transition focus:border-secondary shadow-sm backdrop-blur"
            />
          </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* ADD NEW CARD */}
        <button
          onClick={openNewModal}
          className="group flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-secondary/40 bg-card/40 p-6 text-secondary transition-all hover:bg-secondary/10 hover:border-secondary aspect-[3/4] min-h-[300px]"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20 transition-transform group-hover:scale-110 group-active:scale-95">
            <PlusCircle size={32} />
          </div>
          <span className="font-bold">Add New Masala</span>
        </button>

        {/* EXISTING PRODUCT CARDS */}
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            onClick={() => openEditModal(product)}
            className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border bg-card/85 shadow-lg backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl hover:border-secondary/50 text-left aspect-[3/4]"
          >
            <div className="relative aspect-square w-full bg-muted overflow-hidden">
               <ImageWithFallback
                 src={resolveCatalogImage(product.image)}
                 alt={product.name}
                 className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
               />
               {product.featured && (
                   <div className="absolute top-3 right-3 bg-secondary text-secondary-foreground text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                       Featured
                   </div>
               )}
            </div>
            
            <div className="flex flex-1 flex-col p-5">
               <div className="flex items-start justify-between gap-2 mb-1">
                   <h3 className="font-bold text-foreground line-clamp-2 leading-tight">{product.name}</h3>
                   <span className="font-black text-secondary shrink-0">₹{product.price}</span>
               </div>
               <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 block">
                 {product.category}
               </span>
               <p className="text-xs text-muted-foreground line-clamp-3 mt-auto">
                 {product.description || 'No description provided.'}
               </p>
            </div>
          </button>
        ))}
      </div>

      {/* Editor Modal Overlay */}
      <Dialog.Root open={activeModal !== null} onOpenChange={(open) => !open && closeModal()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[2rem] border border-border bg-card p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-2xl font-black text-foreground">
                {activeModal === 'NEW' ? 'Create New Masala' : 'Edit Product'}
              </Dialog.Title>
              <Dialog.Close className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-card">
                <X size={20} />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-4">
                    <label className="block">
                    <span className="mb-2 block text-sm font-bold text-foreground">Product Name</span>
                    <input
                        value={draft.name}
                        onChange={handleDraftChange('name')}
                        className="w-full rounded-2xl border border-border bg-muted/50 px-4 py-3 outline-none transition focus:border-secondary focus:bg-card"
                        placeholder="Example: Punjabi Sabzi Masala"
                        required
                    />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                        <span className="mb-2 block text-sm font-bold text-foreground">Price</span>
                        <input
                        type="number"
                        min="1"
                        value={draft.price || ''}
                        onChange={handleDraftChange('price')}
                        className="w-full rounded-2xl border border-border bg-muted/50 px-4 py-3 outline-none transition focus:border-secondary focus:bg-card"
                        placeholder="250"
                        required
                        />
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-sm font-bold text-foreground">Category</span>
                        <select
                        value={draft.category}
                        onChange={handleDraftChange('category')}
                        className="w-full rounded-2xl border border-border bg-muted/50 px-4 py-3 outline-none transition focus:border-secondary focus:bg-card"
                        >
                        <option value="veg">Veg</option>
                        <option value="non-veg">Non-veg</option>
                        </select>
                    </label>
                    <label className="block sm:col-span-2">
                        <span className="mb-2 block text-sm font-bold text-foreground">Tax Percentage (%)</span>
                        <input
                        type="number"
                        min="0"
                        max="100"
                        value={draft.taxPercent ?? 5}
                        onChange={handleDraftChange('taxPercent')}
                        className="w-full rounded-2xl border border-border bg-muted/50 px-4 py-3 outline-none transition focus:border-secondary focus:bg-card"
                        placeholder="5"
                        required
                        />
                    </label>
                    </div>

                    <div>
                      <span className="mb-2 block text-sm font-bold text-foreground">Image (URL or Local File)</span>
                      <div className="flex items-center gap-2">
                        <input
                            value={draft.image}
                            onChange={handleDraftChange('image')}
                            className="flex-1 min-w-0 rounded-2xl border border-border bg-muted/50 px-4 py-3 outline-none transition focus:border-secondary focus:bg-card"
                            placeholder="masala.jpg"
                        />
                        <label className="cursor-pointer shrink-0 inline-flex h-full items-center justify-center gap-2 rounded-2xl border border-secondary bg-secondary/10 px-4 py-3 font-semibold text-secondary hover:bg-secondary hover:text-secondary-foreground transition-all">
                          <Upload size={18} />
                          <span className="hidden sm:inline">Upload</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload} 
                          />
                        </label>
                      </div>
                      <span className="mt-2 block text-xs text-muted-foreground">{assetHints.join(', ')}</span>
                    </div>

                    <label className="block">
                    <span className="mb-2 block text-sm font-bold text-foreground">Description</span>
                    <textarea
                        value={draft.description}
                        onChange={handleDraftChange('description')}
                        className="min-h-[100px] w-full rounded-2xl border border-border bg-muted/50 px-4 py-3 outline-none transition focus:border-secondary focus:bg-card resize-none"
                        placeholder="Short product description"
                        required
                    />
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition cursor-pointer">
                    <input
                        type="checkbox"
                        checked={draft.featured ?? false}
                        onChange={handleDraftChange('featured')}
                        className="h-4 w-4 accent-secondary rounded"
                    />
                    Feature on Homepage
                    </label>
                </div>

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    {activeModal !== 'NEW' && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-6 py-3 font-bold text-primary transition hover:bg-primary/20 sm:w-auto"
                        >
                            <Trash2 size={18} />
                            Delete
                        </button>
                    )}
                    <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-8 py-3 font-bold text-secondary-foreground transition hover:opacity-90 active:scale-95 sm:w-auto shadow-xl shadow-secondary/20"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
