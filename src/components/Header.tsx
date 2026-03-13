import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import MegaMenu from "./MegaMenu";
import "./header.css";

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 👇 CLICK NGOÀI THÌ ĐÓNG
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="logo">
          TOOL CRAWLER
        </Link>

        <div className="nav-item has-mega-menu" ref={menuRef}>
          <span
            className="nav-title"
            onClick={() => setOpen((prev) => !prev)}
          >
            Công cụ miễn phí ▾
          </span>

          {open && <MegaMenu onClose={() => setOpen(false)}/>}
        </div>
      </div>

      <div className="header-right">
        <Link to="/about" className="nav-link">
          About
        </Link>
        <Link to="/contact" className="nav-link">
          Contact
        </Link>
        <Link to="/terms" className="nav-link">
          Điều khoản
        </Link>
      </div>
    </header>
  );
}