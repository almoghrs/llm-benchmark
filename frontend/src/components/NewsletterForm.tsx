import React, { useState } from 'react';
import type { FormEvent } from 'react';

export interface NewsletterFormProps {}

const NewsletterForm: React.FC<NewsletterFormProps> = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Newsletter signup:', email);
    setSubmitted(true);
    setEmail('');
  };

  return (
    <section className="newsletter">
      <h2>Subscribe to our newsletter</h2>
      {submitted ? (
        <p>Thank you for subscribing!</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="newsletter-email">Email address</label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
          <button type="submit">Subscribe</button>
        </form>
      )}
    </section>
  );
};

export default NewsletterForm;
