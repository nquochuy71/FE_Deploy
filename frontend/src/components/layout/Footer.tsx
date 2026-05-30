import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, CreditCard } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__main" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>
          <div>
            <h3 className="footer__brand-name" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)', fontSize: '1.5rem', marginBottom: '1rem' }}>LUMIÈRE</h3>
            <p className="footer__brand-desc">
              Nơi hội tụ những thương hiệu mỹ phẩm hàng đầu thế giới.
              Mang đến trải nghiệm mua sắm thông minh với AI tư vấn cá nhân hóa.
            </p>
            <div className="footer__social" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Link to="#" className="footer__social-link" title="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </Link>
              <Link to="#" className="footer__social-link" title="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </Link>
              <Link to="#" className="footer__social-link" title="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </Link>
              <Link to="#" className="footer__social-link" title="Youtube">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </Link>
            </div>
          </div>

          <div>
            <h4 className="footer__heading" style={{ color: 'var(--color-black)', marginBottom: '1.5rem' }}>Mua Sắm</h4>
            <ul className="footer__links">
              <li><Link to="/products" className="footer__link">Sản phẩm mới</Link></li>
              <li><Link to="/products" className="footer__link">Best Sellers</Link></li>
              <li><Link to="/products" className="footer__link">Khuyến mãi</Link></li>
              <li><Link to="/products" className="footer__link">Thương hiệu</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer__heading" style={{ color: 'var(--color-black)', marginBottom: '1.5rem' }}>Hỗ Trợ</h4>
            <ul className="footer__links">
              <li><Link to="#" className="footer__link">Hướng dẫn mua hàng</Link></li>
              <li><Link to="#" className="footer__link">Chính sách đổi trả</Link></li>
              <li><Link to="#" className="footer__link">FAQ</Link></li>
              <li><Link to="#" className="footer__link">Liên hệ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer__heading" style={{ color: 'var(--color-black)', marginBottom: '1.5rem' }}>Liên Hệ</h4>
            <ul className="footer__links">
              <li><span className="footer__link" style={{ display: 'flex', alignItems: 'center' }}><MapPin size={16} style={{ marginRight: '8px', color: 'var(--color-gold)' }} />123 Nguyễn Huệ, Q.1, TP.HCM</span></li>
              <li><span className="footer__link" style={{ display: 'flex', alignItems: 'center' }}><Phone size={16} style={{ marginRight: '8px', color: 'var(--color-gold)' }} />1900 8888</span></li>
              <li><span className="footer__link" style={{ display: 'flex', alignItems: 'center' }}><Mail size={16} style={{ marginRight: '8px', color: 'var(--color-gold)' }} />hello@lumiere.vn</span></li>
              <li><span className="footer__link" style={{ display: 'flex', alignItems: 'center' }}><Clock size={16} style={{ marginRight: '8px', color: 'var(--color-gold)' }} />8:00 - 22:00 hàng ngày</span></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-gray-300)' }}>
          <span>© 2026 Lumière Beauty. All rights reserved.</span>
          <div className="footer__payment" style={{ display: 'flex', gap: '1rem', color: 'var(--color-gray-500)', alignItems: 'center' }}>
            <div className="footer__payment-icon"><CreditCard size={24} /></div>
            <div className="footer__payment-icon"><CreditCard size={24} /></div>
            <div className="footer__payment-icon"><CreditCard size={24} /></div>
            <div className="footer__payment-icon" style={{ fontWeight: 'bold' }}>VNP</div>
          </div>
        </div>
      </div>
    </footer>
  );
};
