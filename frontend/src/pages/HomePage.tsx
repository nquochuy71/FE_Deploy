import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { CategoriesList } from '../components/CategoriesList';
import type { BrandSummaryResponse, ProductCardResponse } from '../types/catalog';
import carousel1 from '../assets/carousel1.webp';
import carousel2 from '../assets/carousel2.webp';
import carousel3 from '../assets/carousel3.webp';
import carousel4 from '../assets/carousel4.webp';
import subCarousel1 from '../assets/sub_carousel1.jpg';
import subCarousel2 from '../assets/sub_carousel2.jpg';
import subCarousel3 from '../assets/sub_carousel3.jpg';
import subCarousel4 from '../assets/sub_carousel4.jpg';
import program1 from '../assets/program.webp';
import program2 from '../assets/program2.webp';
import program3 from '../assets/program3.webp';
import program4 from '../assets/program4.webp';


const MOCK_BRANDS: BrandSummaryResponse[] = [
  { id: '1', name: 'Aquamarine', slug: 'aquamarine' },
  { id: '2', name: 'Coral Reef', slug: 'coral-reef' },
  { id: '3', name: 'Seaside', slug: 'seaside' },
  { id: '4', name: 'Wave', slug: 'wave' },
  { id: '5', name: 'Marina', slug: 'marina' },
  { id: '6', name: 'Lagoon', slug: 'lagoon' },
];

const MOCK_BEST_SELLERS: ProductCardResponse[] = [];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const carouselImages = [carousel1, carousel2, carousel3, carousel4];
  const subCarouselImages = [subCarousel1, subCarousel2, subCarousel3, subCarousel4];
  const programImages = [program1, program2, program3, program4];
  const [activeIndex, setActiveIndex] = useState(0);
  const [bestSellers] = useState<ProductCardResponse[]>(MOCK_BEST_SELLERS);
  const [bestSellerIndex, setBestSellerIndex] = useState(0);
  const [bestSellerLoading] = useState(false);
  const brands = MOCK_BRANDS;
  const [brandIndex, setBrandIndex] = useState(0);
  const visibleBrandCount = 6;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % carouselImages.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [carouselImages.length]);

  useEffect(() => {
    if (!brands || brands.length <= visibleBrandCount) return;
    const timer = window.setInterval(() => {
      setBrandIndex((prev) => (prev + 1) % brands.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [brands, visibleBrandCount]);

  const visibleBestSellers = useMemo(() => {
    const visibleCount = 5;
    if (bestSellers.length <= visibleCount) return bestSellers;
    return bestSellers.slice(bestSellerIndex, bestSellerIndex + visibleCount);
  }, [bestSellers, bestSellerIndex]);

  const handleBestSellerNext = () => {
    const visibleCount = 5;
    const maxStart = Math.max(0, bestSellers.length - visibleCount);
    setBestSellerIndex((prev) => (prev >= maxStart ? 0 : prev + 1));
  };

  const handleBestSellerPrev = () => {
    const visibleCount = 5;
    const maxStart = Math.max(0, bestSellers.length - visibleCount);
    setBestSellerIndex((prev) => (prev <= 0 ? maxStart : prev - 1));
  };

  const visibleBrands = useMemo(() => {
    if (!brands || brands.length <= visibleBrandCount) return brands;
    const items: BrandSummaryResponse[] = [];
    for (let i = 0; i < visibleBrandCount; i += 1) {
      items.push(brands[(brandIndex + i) % brands.length]);
    }
    return items;
  }, [brands, brandIndex, visibleBrandCount]);

  const handleBrandNext = () => {
    if (!brands || brands.length <= visibleBrandCount) return;
    setBrandIndex((prev) => (prev + 1) % brands.length);
  };

  const handleBrandPrev = () => {
    if (!brands || brands.length <= visibleBrandCount) return;
    setBrandIndex((prev) => (prev - 1 + brands.length) % brands.length);
  };

  return (
    <div className="home-page">
      <section className="home-carousel">
        <div className="container">
          <div className="home-carousel__grid">
            <div className="home-carousel__main">
              <div className="home-carousel__frame">
                <img
                  src={carouselImages[activeIndex]}
                  alt={`Carousel ${activeIndex + 1}`}
                  loading="lazy"
                />
              </div>
              <div className="home-carousel__dots">
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={
                      index === activeIndex
                        ? 'home-carousel__dot home-carousel__dot--active'
                        : 'home-carousel__dot'
                    }
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Chuyển đến ảnh ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            <div className="home-carousel__side">
              {subCarouselImages.map((img, index) => (
                <div key={index} className="home-carousel__side-card">
                  <img src={img} alt={`Sub carousel ${index + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {brands && Array.isArray(brands) && brands.length > 0 && (
        <section className="brands-carousel">
          <div className="container">
            <div className="brands-carousel__header">
              <div>
                <p className="brands-carousel__eyebrow">Thương hiệu nổi tiếng</p>
                <h2 className="brands-carousel__title">Thương hiệu</h2>
              </div>
            </div>

            <div className="brands-carousel__body">
              <button
                type="button"
                className="brands-carousel__nav"
                onClick={handleBrandPrev}
                aria-label="Thương hiệu trước"
                disabled={brands.length <= visibleBrandCount}
              >
                <ChevronLeft size={18} />
              </button>

              <div className="brands-carousel__track">
                {visibleBrands.map((brand) => (
                  <button
                    key={brand.id}
                    type="button"
                    className="brands-carousel__card"
                    onClick={() => navigate(`/brands/${brand.slug}`)}
                  >
                    <div className="brands-carousel__image">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={brand.name} loading="lazy" />
                      ) : (
                        <div className="brands-carousel__fallback">
                          <span>{brand.name.slice(0, 2).toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div className="brands-carousel__name">{brand.name}</div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="brands-carousel__nav"
                onClick={handleBrandNext}
                aria-label="Thương hiệu tiếp theo"
                disabled={brands.length <= visibleBrandCount}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="best-sellers">
        <div className="container">
          <div className="best-sellers__header">
            <div>
              <p className="best-sellers__eyebrow">Top 10 bán chạy</p>
              <h2 className="best-sellers__title">Best Sellers</h2>
            </div>
            <div className="best-sellers__controls">
              <button
                type="button"
                className="best-sellers__nav"
                onClick={handleBestSellerPrev}
                aria-label="Sản phẩm trước"
                disabled={bestSellers.length <= 5}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="best-sellers__nav"
                onClick={handleBestSellerNext}
                aria-label="Sản phẩm tiếp theo"
                disabled={bestSellers.length <= 5}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {bestSellerLoading && (
            <div className="best-sellers__status">Đang tải sản phẩm bán chạy...</div>
          )}

          {!bestSellerLoading && visibleBestSellers.length === 0 && (
            <div className="best-sellers__status">Chưa có sản phẩm bán chạy.</div>
          )}

          {!bestSellerLoading && visibleBestSellers.length > 0 && (
            <div className="best-sellers__track">
              {visibleBestSellers.map((product) => {
                const price = product.minPrice ?? product.maxPrice ?? 0;
                const priceLabel = price
                  ? `${price.toLocaleString('vi-VN')}đ`
                  : 'Liên hệ';
                const rating = product.averageRating ?? 0;
                return (
                  <article key={product.id} className="best-sellers__card">
                    <Link
                      to={`/product/${product.slug}?source=HOME`}
                      state={{ productId: product.id }}
                      className="best-sellers__link"
                    >
                      <div className="best-sellers__image">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt={product.name} loading="lazy" />
                        ) : (
                          <div className="best-sellers__placeholder">No image</div>
                        )}
                        <span className="best-sellers__badge">Best</span>
                      </div>
                      <div className="best-sellers__info">
                        <h3 className="best-sellers__name">{product.name}</h3>
                        <div className="best-sellers__meta">
                          <div className="best-sellers__rating">
                            <Star size={14} fill="currentColor" />
                            <span>{rating.toFixed(1)}</span>
                          </div>
                          <span className="best-sellers__sold">
                            {product.totalSold ? `${product.totalSold} đã bán` : 'Mới'}
                          </span>
                        </div>
                        <div className="best-sellers__price">{priceLabel}</div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero__container">
          <div className="hero__content">
            <h1 className="hero__title">Khám phá vẻ đẹp tự nhiên</h1>
            <p className="hero__subtitle">
              Những sản phẩm chăm sóc da cao cấp từ các thương hiệu hàng đầu
            </p>
            <div className="hero__actions">
              <button 
                className="btn btn--primary"
                onClick={() => navigate('/products')}
              >
                Khám phá ngay
              </button>
            </div>
          </div>
        </div>
      </section>

      <CategoriesList />

      <section className="programs">
        <div className="container">
          <div className="programs__header">
            <h2 className="programs__title">Chương Trình Nổi Bật</h2>
          </div>
          <div className="programs__grid">
            {programImages.map((image, index) => (
              <div key={index} className="programs__card">
                <img src={image} alt={`Program ${index + 1}`} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="service-strip">
        <div className="container">
          <div className="service-strip__grid">
            <div className="service-strip__item">
              <div className="service-strip__icon">COD</div>
              <div className="service-strip__text">
                <span>Thanh toán</span>
                <strong>khi nhận hàng</strong>
              </div>
            </div>
            <div className="service-strip__item">
              <div className="service-strip__icon">2H</div>
              <div className="service-strip__text">
                <span>Giao nhanh</span>
                <strong>miễn phí 2H</strong>
              </div>
            </div>
            <div className="service-strip__item">
              <div className="service-strip__icon">30</div>
              <div className="service-strip__text">
                <span>30 ngày đổi</span>
                <strong>trả miễn phí</strong>
              </div>
            </div>
            <div className="service-strip__item">
              <div className="service-strip__icon">OK</div>
              <div className="service-strip__text">
                <span>Thương hiệu</span>
                <strong>uy tín toàn cầu</strong>
              </div>
            </div>
            <div className="service-strip__cta">
              <div className="service-strip__cta-label">Hotline CSKH</div>
              <div className="service-strip__cta-pill">1800 6324</div>
            </div>
            <div className="service-strip__cta">
              <div className="service-strip__cta-label">Tìm chi nhánh</div>
              <div className="service-strip__cta-pill">Hệ thống LUMIÈRE</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
