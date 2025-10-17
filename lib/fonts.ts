import localFont from 'next/font/local'

export const bentonSans = localFont({
  src: [
    {
      path: '../public/fonts/benton-sans/BentonSans Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/benton-sans/BentonSans Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/benton-sans/BentonSans Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/benton-sans/BentonSans Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/benton-sans/BentonSans Black.otf',
      weight: '900',
      style: 'normal',
    },
    {
      path: '../public/fonts/benton-sans/BentonSans ExtraLight.otf',
      weight: '200',
      style: 'normal',
    },
  ],
}) 