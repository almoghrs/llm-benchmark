import Layout from './components/Layout';
import heroImg from './assets/hero.png';
import './index.css';
import NewsletterForm from './components/NewsletterForm';
import ContactForm from './components/ContactForm';

function App() {
  return (
    <Layout title="Axiom Apparel">
      <section className="hero-section">
        <img src={heroImg} alt="Hero" className="hero-image" width={300} />
        <h1>Welcome to Axiom Apparel</h1>
        <p>Timeless, sustainable essentials.</p>
      </section>
      <NewsletterForm />
      <ContactForm />
    </Layout>
  );
}

export default App;
