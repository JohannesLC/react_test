import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {

  const navigate = useNavigate();

  function onClick() {
    navigate('/about');
  }

  return (
    <div className="home-container">
      <h1>Welcome to Our Website</h1>
      <p>
        We are committed to providing the best services and products to our customers. Explore our
        site to learn more about what we offer.
      </p>
      <button onClick={onClick}>Get Started</button>
    </div>
  );
};

export default Home;
