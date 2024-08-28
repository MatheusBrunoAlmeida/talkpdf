export const PLANS = [
  {
    name: 'Free',
    slug: 'free',
    quota: 5,
    pagesPerPdf: 5,
    price: {
      amount: 0,
      priceIds: {
        test: '',
        production: '',
      },
    },
  },
  {
    name: 'Pro',
    slug: 'pro',
    quota: 50,
    sizePdf: 16,
    pagesPerPdf: 35,
    price: {
      amount: 25,
      priceIds: {
        test: 'price_1PsA3yBHCJHsCGMUehvd3HE3',
        production: 'price_1PsA3yBHCJHsCGMUehvd3HE3',
      },
    },
  },
  {
    name: 'Premium',
    slug: 'premium',
    quota: 80,
    sizePdf: 80,
    pagesPerPdf: 300,
    price: {
      amount: 49,
      priceIds: {
        test: 'price_1PsSoQBHCJHsCGMUL3IXw3tH',
        production: 'price_1PsSoQBHCJHsCGMUL3IXw3tH',
      },
    },
  },
]
