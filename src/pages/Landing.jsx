import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Hero from '../features/landing/Hero'
import Features from '../features/landing/Features'
import HowItWorks from '../features/landing/HowItWorks'
import About from '../features/landing/About'
import Faq from '../features/landing/Faq'
import FinalCta from '../features/landing/FinalCta'

export default function Landing() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <Navbar />
      <main id="main">
        <Hero />
        <Features />
        <HowItWorks />
        <About />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}