import React from 'react';
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getImage } from '../../assets/images';

export default function Footer() {
  return (
    <footer className="bg-neutral text-neutral-foreground/80 pt-20 pb-10">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Info */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <ImageWithFallback
                src={getImage('logo_bg_removed.png')}
                alt="HMP Masala Logo"
                className="h-11 w-auto object-contain"
              />
              <span className="text-2xl font-black text-neutral-foreground tracking-tight">
                HMP Masala
              </span>
            </div>
            <p className="text-neutral-foreground/70 leading-relaxed max-w-sm">
              Authentic Indian spices, crafted with love and tradition. 
              Elevate your everyday meals with the purest ingredients from nature.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-neutral/80 flex items-center justify-center hover:bg-primary hover:text-neutral-foreground transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-neutral/80 flex items-center justify-center hover:bg-primary hover:text-neutral-foreground transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-neutral/80 flex items-center justify-center hover:bg-primary hover:text-neutral-foreground transition-colors">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-neutral-foreground font-bold text-lg mb-6">Quick Links</h4>
            <ul className="flex flex-col gap-4">
              <li><a href="#home" className="hover:text-secondary transition-colors">Home</a></li>
              <li><a href="#products" className="hover:text-secondary transition-colors">Shop Spices</a></li>
              <li><a href="#about" className="hover:text-secondary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Recipes</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Contact Support</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-neutral-foreground font-bold text-lg mb-6">Contact Us</h4>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-secondary shrink-0 mt-1" />
                <span>At Padapan, Ta. Gadhadha(Swa.),<br/>Di. Botad, Gujrat, India - 364730</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="text-secondary shrink-0" />
                <span>+91 87806 06650</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} className="text-secondary shrink-0" />
                <span>hello@hmpmasala.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-neutral-foreground font-bold text-lg mb-6">Newsletter</h4>
            <p className="text-neutral-foreground/70 mb-4">
              Subscribe to get special offers, free recipes, and once-in-a-lifetime deals.
            </p>
            <form className="flex flex-col gap-3">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-neutral/80 border border-neutral/60 text-neutral-foreground px-4 py-3 rounded-xl focus:outline-none focus:border-secondary transition-colors"
                required
              />
              <button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-neutral/70 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-foreground/60">
          <p>&copy; {new Date().getFullYear()} HMP Masala. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-neutral-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-neutral-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-neutral-foreground transition-colors">Shipping Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
