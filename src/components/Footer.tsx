export default function Footer() {
  return (
    <footer style={footerStyle}>
      <p>© 2026 Maps Crawler Tool</p>
      <p>Crawl Google Maps • Instagram • TikTok</p>
    </footer>
  );
}

const footerStyle: React.CSSProperties = {
  marginTop: 80,
  padding: 24,
  textAlign: "center",
  background: "#0f172a",
  color: "#94a3b8",
};