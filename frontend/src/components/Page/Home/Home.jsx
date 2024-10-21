import React from 'react';
import Am from "../../../assets/Am.jpeg";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white">
        <img
          src={Am}
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="relative flex flex-col items-center justify-center h-screen text-center px-4">
          <h1 className="text-5xl font-bold mb-4">Agik Mart Stock Management</h1>
          <p className="text-xl mb-6">Efficient and Accurate Stock Management, Anytime, Anywhere</p>
          <a
            href="/get-started"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg"
          >
            Get Started
          </a>
        </div>
      </section>

      {/* Navigation */}
      <nav className="bg-gray-800 text-white py-4 dark:bg-gray-100 dark:text-gray-950 hidden lg:block">
        <div className="container mx-auto flex justify-around">
          <a href="#about" className="hover:underline">About Us</a>
          <a href="#testimonials" className="hover:underline">Testimonials</a>
          <a href="#news" className="hover:underline">Latest News</a>
          <a href="#features" className="hover:underline">Features</a>
          <a href="#contact" className="hover:underline">Contact</a>
        </div>
      </nav>

      {/* About Us Section */}
      <section id="about" className="py-16 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold mb-6 text-center">About Us</h2>
          <p className="text-lg text-center">
            Agik Mart Stock Management is a web-based system designed to streamline the stock order and opname processes, making inventory management faster and more accurate for businesses.
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 bg-white text-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold mb-6 text-center">Testimonials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-gray-100 rounded-lg shadow-md">
              <p>"The system has made our stock management incredibly easy and fast. We save so much time!"</p>
              <span className="block mt-4 font-semibold">— Retail Manager</span>
            </div>
            <div className="p-6 bg-gray-100 rounded-lg shadow-md">
              <p>"No more manual errors in stock opname. The system takes care of everything accurately."</p>
              <span className="block mt-4 font-semibold">— Staff Member</span>
            </div>
            <div className="p-6 bg-gray-100 rounded-lg shadow-md">
              <p>"We've improved our stock ordering process and reduced waste with this efficient system."</p>
              <span className="block mt-4 font-semibold">— Store Owner</span>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section id="news" className="py-16 bg-gray-100 text-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold mb-6 text-center">Latest News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">New Feature: Automated Restocking</h3>
              <p>Our system now supports automated restocking alerts for low inventory, ensuring you never run out of stock.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">Multi-location Store Support</h3>
              <p>Manage stock across multiple stores easily with our latest update that supports multi-location inventory management.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white text-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold mb-6 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-gray-100 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">Order Management</h3>
              <p>Easily manage stock orders with real-time error detection and confirmation.</p>
            </div>
            <div className="p-6 bg-gray-100 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">Stock Opname Automation</h3>
              <p>Automate the process of stock-taking, ensuring accurate and efficient records.</p>
            </div>
            <div className="p-6 bg-gray-100 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">Real-Time Reporting</h3>
              <p>Access detailed reports with up-to-the-minute data on stock levels and order statuses.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-100 text-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold mb-6 text-center">Contact Us</h2>
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
            <form>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700">Name</label>
                <input
                  type="text"
                  id="name"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Your Name"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Your Email"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="message" className="block text-gray-700">Message</label>
                <textarea
                  id="message"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Your Message"
                ></textarea>
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg w-full"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
