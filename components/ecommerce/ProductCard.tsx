import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { cn } from "@/lib/utils"
import { ExternalLink, Star, ShoppingCart, Tag } from 'lucide-react'

export interface Product {
  title: string
  link: string
  price: string
  source: string
  rating?: string
  reviews?: string
  imageUrl?: string
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const isAmazon = product.source.toLowerCase().includes('amazon')
  const isFlipkart = product.source.toLowerCase().includes('flipkart')
  
  return (
    <Card className="flex flex-col h-full hover:shadow-xl transition-all duration-300 border-muted-foreground/10 group overflow-hidden bg-card">
      <div className="relative aspect-square w-full bg-white p-4 flex items-center justify-center overflow-hidden border-b">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.title}
            className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground/20">
            <ShoppingCart className="w-12 h-12 mb-2" />
            <span className="text-[10px] font-medium uppercase tracking-widest">No Image</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge 
            className={cn(
              "shadow-sm border-none max-w-[120px] truncate",
              isAmazon ? "bg-[#FF9900] text-black hover:bg-[#FF9900]/90" 
              : isFlipkart ? "bg-[#2874F0] text-white hover:bg-[#2874F0]/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            title={product.source}
          >
            {product.source}
          </Badge>
        </div>
      </div>
      
      <CardContent className="flex-1 flex flex-col p-4 space-y-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex justify-between items-start">
             {product.rating !== 'N/A' && (
              <div className="flex items-center text-xs font-bold text-yellow-500">
                <Star className="w-3 h-3 fill-current mr-1" />
                {product.rating}
                <span className="text-muted-foreground font-normal ml-1">({product.reviews})</span>
              </div>
            )}
          </div>
          
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug h-10">
            {product.title}
          </h3>
          
          <div className="flex items-baseline space-x-2 pt-1">
            <span className="text-xl font-bold text-foreground tracking-tight">
              {product.price}
            </span>
          </div>
        </div>
        
        <div className="pt-3 flex gap-2">
          <Button 
            className="flex-1 h-9 text-xs font-bold shadow-sm" 
            onClick={() => window.open(product.link, '_blank')}
          >
            View Deal
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 shrink-0"
            onClick={() => window.open(product.link, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
