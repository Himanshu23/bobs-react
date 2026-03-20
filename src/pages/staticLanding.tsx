import React, { useEffect, useState } from 'react';
import landingData from '../data/landingData';

interface LandingItem {
  category: string;
  name: string;
  nonVeg: boolean;
  image: string;
  originalPrice: number;
  discountedPrice: number;
}

const landingStyles = `
  :root {
    --warm-white: #fef9f3;
    --warm-orange: #e85d2c;
    --warm-gold: #f4a261;
    --dark: #1a1512;
    --shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
    --radius: 16px;
    --radius-sm: 12px;
  }

  .landing-container {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    height: 100dvh;
    background: url("/imgs/black-bg.jpg") no-repeat center center fixed;
    background-size: cover;
    color: var(--warm-white);
    font-family: 'Outfit', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    position: relative;
  }

  .landing-container::before {
    content: '';
    position: fixed;
    inset: 0;
    background: linear-gradient(180deg, rgba(26, 21, 18, 0.7) 0%, rgba(26, 21, 18, 0.4) 40%, rgba(26, 21, 18, 0.85) 100%);
    pointer-events: none;
    z-index: 0;
  }

  .header {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: 480px;
    padding: 8px 12px 6px;
  }

  .logo img {
    width: 96px;
    height: auto;
    display: block;
  }

  .whatsapp-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    background-color: #25d366;
    color: white;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 10px;
    border-radius: 8px;
    box-shadow: var(--shadow);
    transition: transform 0.2s, box-shadow 0.2s;
    border: none;
    cursor: pointer;
  }

  .whatsapp-button:hover {
    background-color: #1ebe5b;
    transform: translateY(-1px);
    box-shadow: 0 12px 40px rgba(37, 211, 102, 0.35);
  }

  .whatsapp-button img {
    width: 18px;
    height: 18px;
  }

  .scroll-area {
    position: relative;
    z-index: 1;
    flex: 1;
    min-height: 0;
    width: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 100px;
  }

  .page-title {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    padding: 2px 12px 4px;
    text-align: center;
  }

  .page-title h1 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--warm-white);
    margin: 0;
    letter-spacing: 0.02em;
  }

  .page-title .tagline {
    font-size: 0.7rem;
    color: var(--warm-gold);
    margin: 2px 0 0;
  }

  .tiles {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 100%;
    padding: 4px 4px 6px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }

  .tile {
    background: rgba(254, 249, 243, 0.08);
    border: 1px solid rgba(254, 249, 243, 0.1);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    transition: transform 0.15s, box-shadow 0.15s;
    display: flex;
    flex-direction: column;
  }

  .tile:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  }

  .tile-image-wrap {
    position: relative;
  }

  .tile-image {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    display: block;
  }

  .tile-badge {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    border: 1.5px solid rgba(254, 249, 243, 0.9);
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
  }

  .tile-badge.veg {
    background: #22c55e;
  }

  .tile-badge.nonveg {
    background: #ef4444;
  }

  .tile-body {
    flex-shrink: 0;
    padding: 3px 4px 4px;
  }

  .tile-title {
    font-size: 0.6rem;
    font-weight: 600;
    color: var(--warm-white);
    margin: 0 0 1px;
    line-height: 1.15;
    letter-spacing: 0.01em;
  }

  .tile-price {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-wrap: wrap;
  }

  .tile-price .original {
    font-size: 0.55rem;
    color: rgba(254, 249, 243, 0.5);
    text-decoration: line-through;
  }

  .tile-price .discounted {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--warm-gold);
  }

  .menu-link-wrap {
    position: relative;
    z-index: 1;
    text-align: center;
    padding: 0 12px 12px;
  }

  .menu-link {
    display: inline-block;
    color: var(--warm-gold);
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    padding: 4px 0;
    border-bottom: 2px solid transparent;
    transition: border-color 0.2s, color 0.2s;
    cursor: pointer;
    background: none;
    border: none;
  }

  .menu-link:hover {
    color: var(--warm-white);
    border-bottom-color: var(--warm-gold);
  }

  .order-section {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
    width: 100%;
    padding: 10px 16px calc(14px + env(safe-area-inset-bottom, 0));
    background: rgba(26, 21, 18, 0.96);
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .order-section h2 {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--warm-white);
    margin: 0 0 8px;
    text-align: center;
    letter-spacing: 0.03em;
  }

  .order-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .order-btn {
    display: block;
    width: 140px;
    height: 48px;
    padding: 0;
    overflow: hidden;
    border-radius: var(--radius-sm);
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: var(--shadow);
    border: 1px solid rgba(254, 249, 243, 0.15);
    cursor: pointer;
    background: white;
  }

  .order-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }

  .order-btn img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .order-note {
    font-size: 0.65rem;
    color: rgba(254, 249, 243, 0.6);
    text-align: center;
    margin: 6px 12px 0;
    line-height: 1.3;
  }
`;

const StaticLanding: React.FC = () => {
  const [items, setItems] = useState<LandingItem[]>([]);

  useEffect(() => {
    setItems(landingData.items);
  }, []);

  return (
    <>
      <style>{landingStyles}</style>
      <div className="landing-container">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <img src="/imgs/logo.png" alt="Bob's" />
          </div>
          <a
            className="whatsapp-button"
            href="https://wa.me/919643310092"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/imgs/whats_app.svg" alt="" />
            <span>+91 9643310092</span>
          </a>
        </header>

        {/* Scroll Area */}
        <div className="scroll-area">
          {/* Page Title */}
          <div className="page-title">
            <h1>Bob&apos;s — Where cool meets curry</h1>
            <p className="tagline">Featured Delights</p>
          </div>

          {/* Tiles */}
          <main className="tiles">
            {items.map((item, index) => (
              <article className="tile" key={index}>
                {/* Tile Image Wrap */}
                <div className="tile-image-wrap">
                  <img
                    className="tile-image"
                    src={item.image}
                    alt={item.name}
                  />
                  <span
                    className={`tile-badge ${item.nonVeg ? 'nonveg' : 'veg'}`}
                    aria-label={item.nonVeg ? 'Non-veg' : 'Veg'}
                  />
                </div>

                {/* Tile Body */}
                <div className="tile-body">
                  <h2 className="tile-title">{item.name}</h2>
                  <div className="tile-price">
                    {item.originalPrice !== item.discountedPrice && (
                      <span className="original">₹{item.originalPrice}</span>
                    )}
                    <span className="discounted">₹{item.discountedPrice}</span>
                  </div>
                </div>
              </article>
            ))}
          </main>

          {/* Menu Link */}
          {/* <div className="menu-link-wrap">
            <button
              className="menu-link"
              onClick={() => navigate('/bobs/foodList')}
            >
              View Full Menu →
            </button>
          </div> */}
        </div>

        {/* Order Section */}
        <section className="order-section">
          <h2>Order on</h2>
          <div className="order-buttons">
            <a
              className="order-btn"
              href="https://link.zomato.com/xqzv/rshare?id=9438730630563d53"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/imgs/zomato-button.jpg" alt="Order on Zomato" />
            </a>
            <a
              className="order-btn"
              href="https://www.swiggy.com/direct/brand/48321?source=swiggy-direct&subSource=instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/imgs/swiggy-button.jpg" alt="Order on Swiggy" />
            </a>
          </div>
          <p className="order-note">
            **Prices and discount on both the platforms can be different.**
          </p>
        </section>
      </div>
    </>
  );
};

export default StaticLanding;

//export default StaticLanding;
