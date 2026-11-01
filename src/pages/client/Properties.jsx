import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, Building2, MapPin, Eye } from 'lucide-react';

export default function PropertiesPage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProperties(data);
    }
    setLoading(false);
  };

  const statuses = ['All', 'active', 'upcoming', 'fully_funded'];

  const filteredProperties = properties.filter((p) => {
    const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 font-sans max-w-8xl p-4 mx-auto pb-12">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold tracking-tight">Investment Marketplace</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Explore institutional real estate assets open for fractional investment.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search location or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1F4B] focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-[#0B1F4B] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition ${
                  selectedStatus === st
                    ? 'bg-amber-500 text-[#0B1F4B] shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Property Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-80 rounded-xl bg-slate-200 dark:bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#0B1F4B]/40 rounded-xl border border-slate-200 dark:border-slate-800">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-amber-500 opacity-50" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No properties available</h3>
          <p className="text-xs text-slate-500 mt-1">Check back soon or adjust your filter choices.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => {
            const tokenPrice = property.total_tokens > 0 ? property.target_amount / property.total_tokens : 0;
            const fundedPct = property.target_amount > 0 && property.funded_amount !== undefined
              ? Math.round((property.funded_amount / property.target_amount) * 100)
              : Math.round(((property.total_tokens - property.available_tokens) / property.total_tokens) * 100);

            return (
              <div
                key={property.id}
                className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-slate-900">
                  <img
                    src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase bg-slate-900/80 text-amber-400 backdrop-blur-md">
                    {property.roi_percentage}% ROI
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-base line-clamp-1">{property.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="truncate">{property.location}</span>
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Unit Price</p>
                      <p className="font-sans font-bold text-amber-500">${tokenPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Target</p>
                      <p className="font-bold">${property.target_amount?.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Actions - Navigates to dedicated page */}
                  <button
                    onClick={() => navigate(`/properties/${property.id}`)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-amber-500 hover:text-[#0B1F4B] text-xs font-bold transition flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Deal Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}