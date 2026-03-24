import Aboutus from '@/app/_component/Aboutus'
import Testimonials from '@/app/_component/Testinomials'
import Whychoose from '@/app/_component/Whychoose'
import React from 'react'

export const metadata = {
  title: "About Us | Kaal Tools - Engineering Tools & Industrial Supplies",
  description:
    "KAAL TOOLS (formerly ATECH TOOLS) - Third-generation family business manufacturing & exporting engineering tools since 1979. Premium machine tool accessories & industrial supplies.",
  openGraph: {
    title: "About Us | Kaal Tools",
    description:
      "KAAL TOOLS - Third-generation family business manufacturing engineering tools since 1979.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | Kaal Tools",
    description:
      "KAAL TOOLS - Third-generation family business manufacturing engineering tools since 1979.",
  },
};

export default function page() {
  return (
    <>
    <Aboutus/>
    <Whychoose/>
    <Testimonials/>
    <div className='py-6'></div>
    </>
  )
}
