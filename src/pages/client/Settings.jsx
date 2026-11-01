import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { motion } from 'framer-motion';
import { 
  User, Shield, Lock, Loader2, UploadCloud, 
  CheckCircle2, AlertCircle, Save, KeyRound, FileText, Camera, ShieldCheck 
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function SettingsPage() {
  const { user, profile, fetchProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('identity'); // 'identity', 'kyc', 'security'

  // Tab 1: Identity State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [updatingIdentity, setUpdatingIdentity] = useState(false);

  // Tab 2: KYC State (Front Passport, Back Passport, Selfie)
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [uploadingKyc, setUploadingKyc] = useState(false);

  // Tab 3: Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  // Handle Identity Update with Session Guard
  const handleUpdateIdentity = async (e) => {
    e.preventDefault();
    
    if (!user || !user.id) {
      toast.error('Authentication session not loaded. Please wait a moment.');
      return;
    }

    if (!fullName.trim()) {
      toast.error('Full name cannot be empty.');
      return;
    }

    setUpdatingIdentity(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Identity details updated successfully!');
      if (fetchProfile) fetchProfile();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update identity.');
    } finally {
      setUpdatingIdentity(false);
    }
  };

  // Handle KYC Document Upload (Front, Back, Selfie) with Session Guard
  const handleKycUpload = async (e) => {
    e.preventDefault();

    if (!user || !user.id) {
      toast.error('Authentication session not loaded. Please wait a moment.');
      return;
    }

    if (!frontFile || !backFile || !selfieFile) {
      toast.error('Please upload all required files: Passport Front, Passport Back, and Selfie.');
      return;
    }

    setUploadingKyc(true);
    try {
      // Helper function to upload file and return public URL
      const uploadSingleFile = async (file, prefix) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${prefix}-${Date.now()}.${fileExt}`;
        const filePath = `documents/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('kyc-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicURLData } = supabase.storage
          .from('kyc-documents')
          .getPublicUrl(filePath);

        return publicURLData.publicUrl;
      };

      // Upload all 3 images concurrently
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadSingleFile(frontFile, 'front'),
        uploadSingleFile(backFile, 'back'),
        uploadSingleFile(selfieFile, 'selfie')
      ]);

      // Update profile status to pending and save document URLs as JSON
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          kyc_document_url: JSON.stringify({ front: frontUrl, back: backUrl, selfie: selfieUrl }),
          kyc_status: 'pending',
          kyc_submitted_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('KYC documents submitted successfully! Awaiting admin verification.');
      if (fetchProfile) fetchProfile();
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload KYC documents.');
    } finally {
      setUploadingKyc(false);
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (!user || !user.email) {
      toast.error('User session not found.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error('Current password is incorrect.');
        setUpdatingPassword(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const kycStatus = profile?.kyc_status || 'unverified';

  return (
    <div className="space-y-6 font-sans pb-12 max-w-8xl p-4 mx-auto">
      
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Account Settings</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal identity profile, submit verification documents, and secure your account credentials.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 bg-slate-100 dark:bg-[#071326] p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        {[
          { id: 'identity', label: 'Identity Modification', icon: User },
          { id: 'kyc', label: 'KYC Verification', icon: Shield },
          { id: 'security', label: 'Security & Password', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 text-xs font-bold rounded-xl transition ${
                activeTab === tab.id
                  ? 'text-[#0B1F4B] dark:text-amber-400'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeSettingsTab"
                  className="absolute inset-0 bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-amber-500/40 rounded-xl shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: IDENTITY MODIFICATION */}
      {activeTab === 'identity' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6"
        >
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Personal Identity</h3>
            <p className="text-xs text-slate-500">Update your legal name and contact details displayed across the platform.</p>
          </div>

          <form onSubmit={handleUpdateIdentity} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={updatingIdentity}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0B1F4B] font-sans font-bold text-xs shadow-md transition flex items-center space-x-2 disabled:opacity-50"
              >
                {updatingIdentity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* TAB 2: KYC VERIFICATION */}
      {activeTab === 'kyc' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6"
        >
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">KYC Verification Center</h3>
              <p className="text-xs text-slate-500">Provide passport images and a selfie for strict investor compliance.</p>
            </div>
            <div>
              <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                kycStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                kycStatus === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                kycStatus === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                {kycStatus === 'verified' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                <span>{kycStatus}</span>
              </span>
            </div>
          </div>

          {/* STATE A: VERIFIED SUCCESS CARD */}
          {kycStatus === 'verified' ? (
            <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
              <ShieldCheck className="w-16 h-16 mx-auto text-emerald-500" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Identity Fully Verified</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Your KYC documents and selfie have been reviewed and approved by compliance. Your account has full investor clearance.
                </p>
              </div>
            </div>
          ) : kycStatus === 'pending' || uploadingKyc ? (
            /* STATE B: INFINITE LOADING / VERIFYING SPINNER STATE */
            <div className="p-12 rounded-3xl bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <Loader2 className="w-12 h-12 mx-auto text-amber-500 animate-spin" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Verifying Your Documents...</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your KYC package is currently under review by our compliance team. This may take up to 24 hours.
                </p>
              </div>
            </div>
          ) : (
            /* STATE C: UNVERIFIED UPLOAD FORM */
            <form onSubmit={handleKycUpload} className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Required Document Checklist</h4>
                <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li>Passport Front Page (Clear, full-color image of information page).</li>
                  <li>Passport Back Page (Page containing official stamps/endorsements if applicable).</li>
                  <li>Live Selfie (Clear portrait holding your document or looking straight into camera).</li>
                </ul>
              </div>

              {/* 3 Upload Grid Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Front Passport */}
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-center space-y-2 bg-slate-50/50 dark:bg-[#071326]/30">
                  <UploadCloud className="w-8 h-8 mx-auto text-amber-500 opacity-80" />
                  <div>
                    <label className="cursor-pointer text-xs font-bold text-amber-500 hover:underline">
                      <span>Passport Front</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => setFrontFile(e.target.files[0])}
                        className="hidden"
                        required
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                      {frontFile ? frontFile.name : 'Upload front page'}
                    </p>
                  </div>
                </div>

                {/* Back Passport */}
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-center space-y-2 bg-slate-50/50 dark:bg-[#071326]/30">
                  <UploadCloud className="w-8 h-8 mx-auto text-amber-500 opacity-80" />
                  <div>
                    <label className="cursor-pointer text-xs font-bold text-amber-500 hover:underline">
                      <span>Passport Back</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => setBackFile(e.target.files[0])}
                        className="hidden"
                        required
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                      {backFile ? backFile.name : 'Upload back page'}
                    </p>
                  </div>
                </div>

                {/* Selfie */}
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-center space-y-2 bg-slate-50/50 dark:bg-[#071326]/30">
                  <Camera className="w-8 h-8 mx-auto text-amber-500 opacity-80" />
                  <div>
                    <label className="cursor-pointer text-xs font-bold text-amber-500 hover:underline">
                      <span>Live Selfie</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => setSelfieFile(e.target.files[0])}
                        className="hidden"
                        required
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                      {selfieFile ? selfieFile.name : 'Upload selfie photo'}
                    </p>
                  </div>
                </div>

              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploadingKyc || !frontFile || !backFile || !selfieFile}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0B1F4B] font-sans font-bold text-xs shadow-md transition flex items-center space-x-2 disabled:opacity-50"
                >
                  {uploadingKyc ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  <span>Submit KYC Package</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      )}

      {/* TAB 3: SECURITY & PASSWORD RESET */}
      {activeTab === 'security' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6"
        >
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Security Credentials</h3>
            <p className="text-xs text-slate-500">Update your account password securely.</p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={updatingPassword}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0B1F4B] font-sans font-bold text-xs shadow-md transition flex items-center space-x-2 disabled:opacity-50"
              >
                {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

    </div>
  );
}