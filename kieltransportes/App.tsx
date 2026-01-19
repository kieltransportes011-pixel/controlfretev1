import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Services } from './pages/Services';
import { Tracking } from './pages/Tracking';
import { Quote } from './pages/Quote';
import { Contact } from './pages/Contact';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/servicos" element={<Services />} />
          <Route path="/rastreamento" element={<Tracking />} />
          <Route path="/cotacao" element={<Quote />} />
          <Route path="/contato" element={<Contact />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;