import React from 'react';
import { Link } from 'react-router';
import Hero from '../components/Hero';
import Features from '../components/Features';
import ProductSection from '../components/ProductSection';
import AboutSection from '../components/AboutSection';

export default function Home() {
  return (
    <div>
      <Hero />
      <Features />
      <div className="bg-background pb-20">
        <ProductSection />
        <div className="flex justify-center mt-4">
          <Link
            to="/masalas"
            className="px-10 py-4 bg-primary text-white rounded-full font-bold text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 cursor-pointer inline-block"
          >
            Explore More Masalas
          </Link>
        </div>
      </div>
      <AboutSection />
    </div>
  );
}
