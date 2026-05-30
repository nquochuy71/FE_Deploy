import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { aiApi } from '../api/aiApi';
import type { RecommendationResponse } from '../types/ai';

export const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const res = await aiApi.getRecommendations(10);
        // Extract data properly
        const data = ((res as any).data ?? res) as RecommendationResponse[];
        const recList = Array.isArray(data) ? data : [];

        // Fetch product details for each recommendation
        const enrichedRecs = await Promise.all(recList.map(async (rec) => {
          if (!rec.product && rec.productId) {
            try {
              const productDetail = await import('../api/catalogApi').then(m => m.catalogApi.getProductById(rec.productId));
              const prodData = ((productDetail as any).data ?? productDetail);
              rec.product = {
                id: prodData.id || prodData.productId,
                productId: prodData.productId || prodData.id,
                name: prodData.name,
                imageUrl: prodData.thumbnail || (prodData.images?.[0]?.url) || undefined,
                price: prodData.minPrice || prodData.price || 0,
                slug: prodData.slug,
              };
            } catch (err) {
              console.error('Failed to fetch product detail for recommendation', rec.productId, err);
            }
          }
          return rec;
        }));

        setRecommendations(enrichedRecs);
      } catch (err: any) {
        console.error('Failed to fetch recommendations:', err);
        setError('Không thể tải danh sách gợi ý. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-[#D4AF37] mb-4 text-xl">Đang phân tích sở thích của bạn...</div>
        <div className="w-10 h-10 border-4 border-[#f3f3f3] border-t-[#D4AF37] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-500">
        <h2 className="text-2xl font-bold mb-2">Chưa có gợi ý nào</h2>
        <p>Hãy xem và tương tác thêm với các sản phẩm để AI có thể gợi ý chính xác nhé!</p>
        <Link 
          to="/products" 
          className="mt-6 px-6 py-3 bg-[#D4AF37] text-white rounded-lg font-bold hover:bg-[#bfa032] transition-colors"
        >
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      {/* Header Section */}
      <div className="text-center mb-16">
        <span className="text-xs font-bold text-[#C9A96E] tracking-[0.3em] uppercase block mb-3">
          Cá nhân hóa trải nghiệm
        </span>
        <h1 className="text-3xl md:text-5xl font-light text-gray-900 tracking-[0.15em] uppercase font-display mb-6">
          Dành Cho Bạn
        </h1>
        <div className="w-20 h-[1.5px] bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent mx-auto mb-6"></div>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto italic font-accent leading-relaxed">
          Hành trình nuôi dưỡng làn da độc bản. Hệ thống trí tuệ nhân tạo Lumière phân tích thói quen và sở thích của bạn để đề xuất những liệu trình chăm sóc hoàn hảo nhất.
        </p>
      </div>

      {/* Recommendations List */}
      <div className="fan-card-container flex flex-col gap-12 py-8">
        {recommendations.map((rec) => {
          const product = rec.product;
          if (!product) return null;

          // Nếu URL là null/undefined, dùng ảnh placeholder
          const imageUrl = product.imageUrl || 'https://via.placeholder.com/300?text=No+Image';

          return (
            <Link
              key={rec.id}
              to={`/product/${(product as any).slug || product.id}?source=RECOMMENDATION_ENGINE`}
              state={{ productId: product.id || product.productId }}
              className="fan-card group block bg-white rounded-2xl border border-[#E8D5A8]/20 overflow-hidden"
            >
              <div className="flex flex-col md:flex-row min-h-[300px]">
                {/* Ảnh sản phẩm */}
                <div className="w-full md:w-[320px] lg:w-[360px] min-h-[280px] md:min-h-[320px] relative overflow-hidden bg-[#FAF6F0] flex-shrink-0">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Glassmorphism Badge */}
                  <div className="absolute top-5 left-5 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold tracking-widest uppercase px-4 py-2 rounded-full border border-white/10 shadow-lg z-10">
                    Độ phù hợp: {Math.round(rec.score * 100)}%
                  </div>
                </div>

                {/* Nội dung sản phẩm */}
                <div className="flex-1 p-8 md:p-10 flex flex-col justify-between">
                  <div>
                    {/* Danh mục hoặc nhãn phụ */}
                    <span className="text-[10px] font-bold text-[#A68B5B] tracking-[0.2em] uppercase block mb-3">
                      Đề xuất riêng
                    </span>
                    <h3 className="font-display text-2xl md:text-3xl font-medium text-gray-900 mb-4 group-hover:text-[#C9A96E] transition-colors duration-300 tracking-wide leading-tight">
                      {product.name}
                    </h3>
                    
                    {product.price !== undefined && (
                      <div className="text-xl font-semibold text-[#C9A96E] tracking-wider mb-6">
                        {product.price.toLocaleString('vi-VN')} đ
                      </div>
                    )}
                  </div>

                  {rec.reason && (
                    <div className="bg-gradient-to-br from-[#FAF6F0] to-[#FAF6F0]/60 rounded-2xl p-7 md:p-8 border border-[#C9A96E]/30 group-hover:border-[#C9A96E]/60 shadow-[0_4px_25px_rgba(201,169,110,0.04)] group-hover:shadow-[0_10px_35px_rgba(201,169,110,0.08)] transition-all duration-500 mt-6">
                      <div className="flex items-start gap-4">
                        <span className="text-2xl mt-0.5 text-[#C9A96E] animate-pulse" role="img" aria-label="sparkles">✨</span>
                        <div className="flex-1">
                          <h4 className="text-xs md:text-sm font-bold text-[#8B6F4E] uppercase tracking-[0.2em] mb-3">
                            Phân tích chuyên sâu từ Lumière AI
                          </h4>
                          <p className="text-gray-800 text-base md:text-lg leading-relaxed group-hover:text-black transition-colors duration-300 font-medium italic">
                            {rec.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationsPage;
