import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getProductImageUrl } from "../utils/urls";

type Product = {
  product_id: number;
  title: string;
  description: string;
  category: string;
  fixed_price: number;
  image_path?: string;
  is_sold: number;
  seller_name: string;
  created_at: string;
  sale_mode: string;
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>("");

  useEffect(() => {
    api.get(`/product/${id}`)
      .then(res => {
        setProduct(res.data);
        if (res.data.image_path) {
          setMainImage(res.data.image_path.split(',')[0]);
        }
      })
      .catch(err => {
        console.error("Failed to load product", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-white text-center py-20">Loading product details...</div>;
  if (!product) return <div className="text-white text-center py-20">Product not found.</div>;

  const images = product.image_path ? product.image_path.split(',') : [];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 text-white">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 text-sm text-gray-400 hover:text-black flex items-center"
      >
        &larr; Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images Section */}
        <div className="space-y-4">
          <div className="bg-[#2D2D2D] rounded-2xl overflow-hidden aspect-square flex items-center justify-center border border-gray-700">
            {mainImage ? (
              <img 
                src={getProductImageUrl(mainImage) || "/assets/placeholder-image.png"}
                alt={product.title} 
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = '/assets/placeholder-image.png'; }}
              />
            ) : (
              <span className="text-gray-500">No Image Available</span>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              {images.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setMainImage(img)}
                  className={`bg-[#2D2D2D] rounded-lg aspect-square overflow-hidden cursor-pointer border-2 transition-colors ${
                    mainImage === img ? 'border-blue-500' : 'border-transparent hover:border-gray-500'
                  }`}
                >
                  <img 
                    src={getProductImageUrl(img) || "/assets/placeholder-image.png"}
                    alt={`Thumbnail ${idx}`} 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/placeholder-image.png'; }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="bg-[#2D2D2D]/50 border border-gray-700 p-8 rounded-2xl">
          <div className="inline-block px-3 py-1 bg-blue-500/10 text-blue-700 text-sm font-semibold rounded-full mb-4 uppercase">
            {product.sale_mode === 'auction' ? 'Auction Item' : 'Direct Sale'}
          </div>
          
          <h1 className="text-4xl font-bold mb-4">{product.title}</h1>
          <p className="text-3xl text-yellow-300 font-bold mb-6">₹{product.fixed_price}</p>
          
          <div className="space-y-4 mb-8 text-gray-300">
            <p className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-200">Category:</span> 
              <span className="font-medium text-white">{product.category || 'N/A'}</span>
            </p>
            <p className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-200">Seller:</span> 
              <span className="font-medium text-white">{product.seller_name}</span>
            </p>
            <p className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-200">Status:</span> 
              <span className={`font-medium ${product.is_sold ? 'text-red-400' : 'text-green-400'}`}>
                {product.is_sold ? 'Sold' : 'Available'}
              </span>
            </p>
            <p className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-200">Listed On:</span> 
              <span className="font-medium text-white">{new Date(product.created_at).toLocaleDateString()}</span>
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Description</h3>
            <div className="bg-[#1A1A1A] p-4 rounded-xl text-gray-300 leading-relaxed border border-gray-700/50 min-h-[150px]">
              {product.description || 'No description provided.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}