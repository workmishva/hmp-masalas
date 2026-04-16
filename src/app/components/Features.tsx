import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Leaf, HeartHandshake, Flame } from 'lucide-react';

const features = [
  {
    icon: <Leaf size={32} className="text-accent" />,
    title: '100% Organic',
    description: 'Sourced directly from organic farms, ensuring pure, untainted flavor in every pinch.',
    color: 'bg-accent/15',
  },
  {
    icon: <ShieldCheck size={32} className="text-secondary" />,
    title: 'No Preservatives',
    description: 'We believe in keeping our spices as nature intended. Zero added colors or preservatives.',
    color: 'bg-secondary/20',
  },
  {
    icon: <Flame size={32} className="text-primary" />,
    title: 'Authentic Taste',
    description: 'Traditional recipes passed down through generations for that authentic home-cooked aroma.',
    color: 'bg-primary/15',
  },
  {
    icon: <HeartHandshake size={32} className="text-secondary" />,
    title: 'Ethically Sourced',
    description: 'We partner directly with farmers to ensure fair trade and superior crop quality.',
    color: 'bg-secondary/15',
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-card p-8 rounded-3xl shadow-sm hover:shadow-xl transition-shadow border border-border flex flex-col items-start gap-4"
            >
              <div className={`p-4 rounded-2xl ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
