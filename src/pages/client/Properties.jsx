import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, Building2, MapPin, Eye, Users, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PropertiesPage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState({}); // Stores investor counts mapped by property ID
  const [propertyList, setPropertyList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchPropertiesWithInvestors();
  }, []);

  // Reset to page 1 whenever search term or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  const fetchPropertiesWithInvestors = async () => {
    setLoading(true);
    
    // 1. Fetch properties
    const { data: propData, error: propError } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (propError || !propData) {
      setLoading(false);
      return;
    }

    // 2. Fetch all platform investments to calculate unique investors per property
    const { data: investData } = await supabase
      .from('investments')
      .select('property_id, user_id');

    // Group unique online investors per property ID
    const investorCountsMap = {};
    propData.forEach((prop) => {
      const propertyInvestments = investData?.filter((inv) => inv.property_id === prop.id) || [];
      const uniqueOnlineInvestors = new Set(propertyInvestments.map((i) => i.user_id)).size;
      
      // Total Investors = Admin Private Sales baseline + Unique platform buyers
      investorCountsMap[prop.id] = (prop.private_sales_investors_count || 0) + uniqueOnlineInvestors;
    });

    setProperties(investorCountsMap);
    setPropertyList(propData);
    setLoading(false);
  };

  const statuses = ['All', 'active', 'upcoming', 'fully_funded'];

  const filteredProperties = propertyList.filter((p) => {
    const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination Calculations
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProperties = filteredProperties.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-8xl p-4 mx-auto pb-12">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold tracking-tight">Investment Marketplace</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Explore institutional real estate markets.
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
          {[1, 2, 3, 4, 5, 6].map((n) => (
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProperties.map((property) => {
              const tokenPrice = property.total_tokens > 0 ? property.target_amount / property.total_tokens : 0;
              const investorCount = properties[property.id] || property.private_sales_investors_count || 0;

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
                    
                    {/* ROI Badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase bg-slate-900/80 text-amber-400 backdrop-blur-md">
                      {property.roi_percentage}% ROI
                    </div>

                    {/* Investors Badge */}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase bg-slate-900/80 text-white backdrop-blur-md flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-amber-400" />
                      <span>{investorCount} Investors</span>
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
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Purchase Price</p>
                        <p className="font-bold">${property.target_amount?.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Actions - Navigates to dedicated page */}
                    <button
                      onClick={() => navigate(`/properties/${property.id}`)}
                      className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-amber-500 hover:text-[#0B1F4B] text-xs font-bold transition flex items-center justify-center space-x-2"
                    >
                      <span>View</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800 mt-4">

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1F4B] text-xs font-bold disabled:opacity-40 hover:border-amber-500 transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-1 px-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                        currentPage === page
                          ? 'bg-amber-500 text-[#0B1F4B]'
                          : 'bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-500'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1F4B] text-xs font-bold disabled:opacity-40 hover:border-amber-500 transition flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}