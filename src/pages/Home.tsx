import "./home.css";

export default function Home() {
  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <h1>
            Biến dữ liệu
            <br />
            thành <span>khách hàng</span>
          </h1>

          <p>
            Công cụ cào dữ liệu Google Maps, Instagram, TikTok giúp bạn tìm
            lead, KOL và doanh nghiệp theo khu vực chỉ trong vài phút.
          </p>

          <div className="hero-actions">
            <a href="/tools/google-maps" className="btn-primary">
              Bắt đầu miễn phí
            </a>
            <a href="/about" className="btn-secondary">
              Tìm hiểu thêm
            </a>
          </div>
        </div>

        <div className="hero-right">
          <div className="video-wrapper">
            <iframe
              src="https://www.youtube.com/embed/vkpcyY7Xe64?autoplay=1&mute=1&loop=1&playlist=vkpcyY7Xe64&controls=0&modestbranding=1&rel=0"
              title="Demo video"
              frameBorder="0"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <h2>Các công cụ nổi bật</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>Google Maps</h3>
            <p>Cào địa điểm, số điện thoại, website theo khu vực</p>
          </div>

          <div className="feature-card">
            <h3>Instagram</h3>
            <p>Tìm KOL, studio, influencer theo ngành</p>
          </div>

          <div className="feature-card">
            <h3>TikTok</h3>
            <p>Phân tích profile, lượt follow, tương tác</p>
          </div>
        </div>
      </section>

      {/* SOCIAL */}
      <section className="socials">
        <div>
          <h2>Hỗ trợ đa nền tảng mạng xã hội</h2>
          <p>Khai thác dữ liệu từ mọi kênh phổ biến hiện nay</p>
        </div>

        <div className="social-grid">
          <div className="social-item facebook">Facebook</div>
          <div className="social-item instagram">Instagram</div>
          <div className="social-item threads">Threads</div>
          <div className="social-item tiktok">TikTok</div>
          <div className="social-item youtube">YouTube</div>
          <div className="social-item twitter">X (Twitter)</div>
          <div className="social-item linkedin">LinkedIn</div>
          <div className="social-item pinterest">Pinterest</div>
          <div className="social-item telegram">Telegram</div>
          <div className="social-item zalo">Zalo</div>
        </div>
      </section>
      {/* CONTACT FORM */}
      <section className="contact">
        <div className="contact-wrapper">
          <div className="contact-left">
            <h2>Liên hệ với chúng tôi</h2>
            <p>
              Bạn cần tư vấn công cụ, hợp tác hoặc demo?
              <br />
              Để lại thông tin – chúng tôi sẽ liên hệ sớm nhất.
            </p>
          </div>

          <form className="contact-form">
            <input type="text" placeholder="Tên của bạn" required />

            <input type="email" placeholder="Email liên hệ" required />

            <textarea rows={4} placeholder="Nội dung liên hệ" />

            <button type="submit" className="btn-primary">
              Gửi liên hệ
            </button>
          </form>
        </div>
      </section>
      {/* CTA */}
      <section className="cta">
        <h2>Bắt đầu xây dựng data của bạn ngay hôm nay</h2>
        <a href="/tools/google-maps" className="btn-primary">
          Dùng thử miễn phí
        </a>
      </section>
    </div>
  );
}
