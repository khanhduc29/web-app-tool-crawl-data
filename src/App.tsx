import { HashRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";

import About from "./pages/About";
import GoogleMapsTool from "./pages/tools/GoogleMapsTool";
import InstagramTool from "./pages/tools/InstagramTool";
import TikTokTool from "./pages/tools/TikTokTool";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import YouTubeTool from "./pages/tools/YoutubeTool";
import PinterestTool from "./pages/tools/PinterestTool";

function App() {
  return (
    <HashRouter>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/tools/google-maps" element={<GoogleMapsTool />} />
        <Route path="/tools/instagram" element={<InstagramTool />} />
        <Route path="/tools/tiktok/:tab?" element={<TikTokTool />} />
        <Route path="/tools/youtube/:tab?" element={<YouTubeTool />} />
        <Route path="/tools/pinterest" element={<PinterestTool />} />
      </Routes>

      <Footer />
    </HashRouter>
  );
}

export default App;
