import React, { useEffect, useState } from 'react';
import { useAuth } from '../../PrivateRouter/AuthContext';
import api from '../../api';
import ProductCard from '../../Components/Products/ProductsCard';

const MyProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const chefUserId = user?.user_id || user?.id;
        if (!chefUserId) return setProducts([]);
        const res = await api.get('/products', { params: { chef_user_id: chefUserId } });
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch chef products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user]);

  if (loading) return <div className="py-20 text-center">Loading your products...</div>;
  if (!products.length) return <div className="py-20 text-center">You have not added any products yet.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
};

export default MyProducts;
