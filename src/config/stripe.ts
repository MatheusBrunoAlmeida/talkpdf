export const PLANS = [
  {
    name: 'Free',
    slug: 'free',
    quota: 2,
    pagesPerPdf: 20,
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
    pagesPerPdf: 100,
    price: {
      amount: 25,
      priceIds: {
        test: 'price_1Ps9Z8BHCJHsCGMUTOKagpNa',
        production: 'price_1Ps9Z8BHCJHsCGMUTOKagpNa',
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
        test: 'price_1PsF0yBHCJHsCGMUPlW781uy',
        production: 'price_1PsF0yBHCJHsCGMUPlW781uy',
      },
    },
  },
]
