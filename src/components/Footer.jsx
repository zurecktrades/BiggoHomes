import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#0B1F4B] text-slate-300 font-sans border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        
        {/* Menu Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9A52E]">Menu</h4>
          <ul className="space-y-2.5 text-sm font-semibold">
            <li><Link to="/" className="hover:text-white transition">Home</Link></li>
            <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
            <li><Link to="/properties" className="hover:text-white transition">Projects</Link></li>
            <li><Link to="/calculator" className="hover:text-white transition">ROI Calculator</Link></li>
          </ul>
        </div>

        {/* Projects Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9A52E]">Projects</h4>
          <ul className="space-y-2.5 text-sm font-semibold">
            <li><Link to="/properties" className="hover:text-white transition">Open for Fundraising</Link></li>
            <li><Link to="/properties" className="hover:text-white transition">Future Projects</Link></li>
            <li><Link to="/properties" className="hover:text-white transition">Completed Portfolios</Link></li>
          </ul>
        </div>

        {/* Office Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9A52E]">Office</h4>
          <div className="text-sm space-y-1.5 text-slate-300 font-normal">
            <p className="font-semibold text-white">Miami Global HQ</p>
            <p>3323 NE 163rd Street</p>
            <p>Suite 600</p>
            <p>Miami, FL 33160</p>
            <p className="pt-2 font-semibold text-[#D9A52E]">+1 (800) 555-BIGGO</p>
          </div>
        </div>

        {/* Contact Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9A52E]">Contact</h4>
          <ul className="space-y-2.5 text-sm font-semibold">
            <li><a href="mailto:contact@biggohomes.com" className="hover:text-white transition">contact@biggohomes.com</a></li>
            <li><a href="#facebook" className="hover:text-white transition">Facebook</a></li>
            <li><a href="#linkedin" className="hover:text-white transition">LinkedIn</a></li>
            <li><a href="#twitter" className="hover:text-white transition">Twitter / X</a></li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} BiggoHomes Inc. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 sm:mt-0 font-semibold">
          <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition">Terms of Use</Link>
        </div>
      </div>
    </footer>
  );
}