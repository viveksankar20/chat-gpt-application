"use client"
import React, { useState } from 'react'
import { ProductCard, type Product } from './ProductCard'
import { Card, CardContent } from '../ui/card'
import { ShoppingBag, AlertCircle, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '../ui/button'

interface EcommerceViewProps {
  products: Product[]
  isLoading: boolean
  query: string
}

export function EcommerceView({ products, isLoading, query }: EcommerceViewProps) {
  const [amazonLimit, setAmazonLimit] = useState(4)
  const [flipkartLimit, setFlipkartLimit] = useState(4)
  const [otherLimit, setOtherLimit] = useState(4)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="h-48 animate-pulse bg-muted/20">
            <CardContent className="h-full flex flex-col justify-center items-center space-y-4">
              <div className="h-4 w-3/4 bg-muted rounded"></div>
              <div className="h-8 w-1/2 bg-muted rounded"></div>
              <div className="h-8 w-full bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (products.length === 0 && query) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="bg-muted p-6 rounded-full">
          <ShoppingBag className="w-12 h-12 text-muted-foreground opacity-20" />
        </div>
        <div>
          <h3 className="text-xl font-bold">No products found</h3>
          <p className="text-muted-foreground">We couldn't find any listings for "{query}" on Amazon or Flipkart.</p>
        </div>
      </div>
    )
  }

  const amazonProducts = products.filter(p => p.source.toLowerCase().includes('amazon'))
  const flipkartProducts = products.filter(p => p.source.toLowerCase().includes('flipkart'))
  const otherProducts = products.filter(p => !p.source.toLowerCase().includes('amazon') && !p.source.toLowerCase().includes('flipkart'))

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center space-x-2 border-b pb-4">
        <ShoppingBag className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Comparing prices for: <span className="text-primary">"{query}"</span></h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Amazon Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-orange-500/20 pb-2">
            <h3 className="font-bold flex items-center text-orange-600">
              <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
              Amazon.in
            </h3>
            <span className="text-xs text-muted-foreground font-medium">{amazonProducts.length} items</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {amazonProducts.length > 0 ? (
              <>
                {amazonProducts.slice(0, amazonLimit).map((product, idx) => (
                  <ProductCard key={`amazon-${idx}`} product={product} />
                ))}
                {amazonProducts.length > amazonLimit && (
                  <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-primary mt-2" onClick={() => setAmazonLimit(prev => prev + 4)}>
                    Show more ({amazonProducts.length - amazonLimit}) <ChevronDown className="ml-1 w-3 h-3" />
                  </Button>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic py-4 text-center border rounded-lg bg-muted/10">No Amazon results found</p>
            )}
          </div>
        </div>

        {/* Flipkart Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
            <h3 className="font-bold flex items-center text-blue-600">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              Flipkart
            </h3>
            <span className="text-xs text-muted-foreground font-medium">{flipkartProducts.length} items</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {flipkartProducts.length > 0 ? (
              <>
                {flipkartProducts.slice(0, flipkartLimit).map((product, idx) => (
                  <ProductCard key={`flipkart-${idx}`} product={product} />
                ))}
                {flipkartProducts.length > flipkartLimit && (
                  <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-primary mt-2" onClick={() => setFlipkartLimit(prev => prev + 4)}>
                    Show more ({flipkartProducts.length - flipkartLimit}) <ChevronDown className="ml-1 w-3 h-3" />
                  </Button>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic py-4 text-center border rounded-lg bg-muted/10">No Flipkart results found</p>
            )}
          </div>
        </div>

        {/* Other Stores Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-green-500/20 pb-2">
            <h3 className="font-bold flex items-center text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              Other Stores
            </h3>
            <span className="text-xs text-muted-foreground font-medium">{otherProducts.length} items</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {otherProducts.length > 0 ? (
              <>
                {otherProducts.slice(0, otherLimit).map((product, idx) => (
                  <ProductCard key={`other-${idx}`} product={product} />
                ))}
                {otherProducts.length > otherLimit && (
                  <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-primary mt-2" onClick={() => setOtherLimit(prev => prev + 4)}>
                    Show more ({otherProducts.length - otherLimit}) <ChevronDown className="ml-1 w-3 h-3" />
                  </Button>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic py-4 text-center border rounded-lg bg-muted/10">No other results found</p>
            )}
          </div>
        </div>
      </div>
      
      {products.length > 0 && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Note: Prices and availability are fetched from search results and may vary upon visiting the site. Always verify the final price on the respective platform before purchasing.
          </p>
        </div>
      )}
    </div>
  )
}
