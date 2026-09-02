'use client';

import { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Globe, 
  Save, 
  Loader2, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  AlertCircle, 
  FileText, 
  UploadCloud, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface KycStatusResponse {
  userId: string;
  accountStatus: 'Not Verified' | 'Pending' | 'Verified' | 'Rejected';
  isVerified: boolean;
  ngoName?: string | null;
  cnicNumber?: string | null;
  kycRequest: {
    id: string;
    ngoName: string;
    cnicNumber: string;
    registrationCertificate: string;
    ntnCertificate: string | null;
    cnicFrontImage: string;
    cnicBackImage: string;
    status: string;
    rejectionReason?: string | null;
    createdAt: string;
  } | null;
  rejectionReason: string | null;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  const { user, refreshUser } = useAuth();
  const isNGO = user?.role === 'NGO';

  // Profile Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // KYC Verification States
  const [kycStatus, setKycStatus] = useState<KycStatusResponse | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [kycStep, setKycStep] = useState(1);
  const [ngoCategories, setNgoCategories] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');

  // KYC Form Fields
  const [ngoName, setNgoName] = useState('');
  const [publicName, setPublicName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [missionStatement, setMissionStatement] = useState('');
  const [yearEst, setYearEst] = useState('');
  const [regType, setRegType] = useState<'Society' | 'Trust' | 'Section 42 Company' | 'Foundation' | 'Other' | ''>('');
  const [regAuthority, setRegAuthority] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [regDate, setRegDate] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [repName, setRepName] = useState('');
  const [repDesignation, setRepDesignation] = useState('');
  const [cnicNumber, setCnicNumber] = useState('');

  // Attached files
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [ntnFile, setNtnFile] = useState<File | null>(null);
  const [cnicFrontFile, setCnicFrontFile] = useState<File | null>(null);
  const [cnicBackFile, setCnicBackFile] = useState<File | null>(null);

  const fetchKycStatus = async () => {
    if (!isNGO) return;
    try {
      setKycLoading(true);
      const res = await api.get('/kyc/my-status');
      const data = res.data.data || res.data;
      setKycStatus(data);
    } catch (err) {
      console.error('Failed to retrieve KYC status:', err);
    } finally {
      setKycLoading(false);
    }
  };

  const fetchNgoCategories = async () => {
    try {
      const res = await api.get('/kyc/categories');
      const data = res.data.data || res.data;
      setNgoCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      if (user.role === 'NGO') {
        fetchKycStatus();
        fetchNgoCategories();
      }
    }
  }, [user]);

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'U';
    const split = nameStr.trim().split(' ');
    if (split.length > 1) {
      return (split[0][0] + split[split.length - 1][0]).toUpperCase();
    }
    return nameStr.slice(0, 2).toUpperCase();
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      await api.patch(`/users/${user.id}`, {
        name: name.trim(),
        email: email.trim() || null,
      });
      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Upload file helper via pre-signed URL + confirm
  const uploadMediaFile = async (file: File, type: string): Promise<string> => {
    setUploadStatus(`Uploading ${file.name}...`);
    // 1. Get pre-signed upload URL
    const urlRes = await api.post('/media/upload-url', {
      fileName: file.name,
      mimeType: file.type,
    });
    const { uploadUrl, storageKey } = urlRes.data.data || urlRes.data;

    // 2. PUT raw file data to pre-signed URL
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload ${file.name} to cloud storage.`);
    }

    // 3. Confirm file upload record
    const confirmRes = await api.post('/media/confirm', {
      type,
      storageKey,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
    const mediaRecord = confirmRes.data.data || confirmRes.data;
    return mediaRecord.id;
  };

  // Submit KYC Application (NGO only)
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoFile || !certFile || !cnicFrontFile || !cnicBackFile) {
      toast.error('Please attach all required documents.');
      return;
    }

    try {
      setSaving(true);
      setUploadStatus('Uploading documents to secure storage...');

      // 1. Upload all documents sequentially
      const logoMediaId = await uploadMediaFile(logoFile, 'KycDocument');
      const certMediaId = await uploadMediaFile(certFile, 'KycDocument');
      const cnicFrontId = await uploadMediaFile(cnicFrontFile, 'KycDocument');
      const cnicBackId = await uploadMediaFile(cnicBackFile, 'KycDocument');
      
      let ntnMediaId: string | undefined = undefined;
      if (ntnFile) {
        ntnMediaId = await uploadMediaFile(ntnFile, 'KycDocument');
      }

      setUploadStatus('Registering KYC application details...');

      // 2. Submit application DTO
      await api.post('/kyc/submit', {
        ngoName: ngoName.trim(),
        publicName: publicName.trim() || undefined,
        organizationDescription: orgDesc.trim(),
        missionStatement: missionStatement.trim() || undefined,
        yearEstablished: parseInt(yearEst),
        registrationType: regType,
        registrationAuthority: regAuthority.trim(),
        registrationNumber: regNumber.trim(),
        registrationDate: regDate,
        categories: selectedCats,
        representativeFullName: repName.trim(),
        representativeDesignation: repDesignation.trim(),
        ngoLogoMediaId: logoMediaId,
        registrationCertificateMediaId: certMediaId,
        ntnCertificateMediaId: ntnMediaId,
        cnicFrontImageMediaId: cnicFrontId,
        cnicBackImageMediaId: cnicBackId,
        cnicNumber: cnicNumber.trim() || undefined,
      });

      toast.success('KYC verification application submitted successfully!');
      setIsKycModalOpen(false);
      setKycStep(1);
      // Reset form fields
      setLogoFile(null);
      setCertFile(null);
      setNtnFile(null);
      setCnicFrontFile(null);
      setCnicBackFile(null);
      fetchKycStatus();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit KYC verification.');
    } finally {
      setSaving(false);
      setUploadStatus('');
    }
  };

  const handleOpenKycWizard = () => {
    setNgoName(user?.ngoName || '');
    setPublicName('');
    setOrgDesc('');
    setMissionStatement('');
    setYearEst('');
    setRegType('');
    setRegAuthority('');
    setRegNumber('');
    setRegDate('');
    setSelectedCats([]);
    setRepName('');
    setRepDesignation('');
    setCnicNumber('');
    setKycStep(1);
    setIsKycModalOpen(true);
  };

  const handleToggleCategory = (cat: string) => {
    if (selectedCats.includes(cat)) {
      setSelectedCats(selectedCats.filter((c) => c !== cat));
    } else {
      setSelectedCats([...selectedCats, cat]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-30 duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account preferences and configuration.
        </p>
      </div>

      {/* NGO KYC Verification Status Card */}
      {isNGO && (
        <Card className="bg-white/5 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/5 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              NGO KYC Verification
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Verify your organization identity to start launching fundraising campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {kycLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full rounded-xl bg-white/5" />
                <Skeleton className="h-20 w-full rounded-xl bg-white/5" />
              </div>
            ) : kycStatus?.accountStatus === 'Verified' ? (
              /* Verified Banner */
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-emerald-500/10 p-5 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">Verified NGO Account</h3>
                      <Badge className="bg-emerald-500 text-white font-semibold text-[10px] px-2 py-0.5">Verified</Badge>
                    </div>
                    <p className="text-xs text-emerald-300/80 mt-1">
                      Organization: <strong className="text-white">{kycStatus.ngoName || user?.ngoName}</strong> • CNIC: <strong className="text-white">{kycStatus.cnicNumber || user?.cnicNumber || 'Registered'}</strong>
                    </p>
                  </div>
                </div>
              </div>
            ) : kycStatus?.accountStatus === 'Pending' ? (
              /* Pending Banner */
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-amber-500/10 p-5 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">Verification Under Review</h3>
                      <Badge className="bg-amber-500 text-black font-semibold text-[10px] px-2 py-0.5">Pending Audit</Badge>
                    </div>
                    <p className="text-xs text-amber-300/80 mt-1">
                      Your legal accreditation documents were submitted and are currently in the audit queue.
                    </p>
                  </div>
                </div>
              </div>
            ) : kycStatus?.accountStatus === 'Rejected' ? (
              /* Rejected Banner */
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-rose-500/10 p-5 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">Verification Declined</h3>
                      <Badge className="bg-rose-500 text-white font-semibold text-[10px] px-2 py-0.5">Action Needed</Badge>
                    </div>
                    <p className="text-xs text-rose-300/80 mt-1">
                      Reason: <span className="font-semibold text-white">{kycStatus.rejectionReason || 'Documentation did not meet criteria.'}</span>
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleOpenKycWizard}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl px-5 h-11 self-start sm:self-auto"
                >
                  Resubmit Application
                </Button>
              </div>
            ) : (
              /* Not Submitted Banner */
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-900 p-5 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Verification Required</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      You have not submitted your organization's KYC details. Please submit details to build verification credentials.
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleOpenKycWizard}
                  className="bg-primary hover:bg-primary/95 text-white font-semibold shadow-lg shadow-primary/20 rounded-xl px-5 h-11 self-start sm:self-auto"
                >
                  Start KYC Verification
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Account Settings Profile */}
      <Card className="bg-white/5 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/5 pb-4">
          <CardTitle className="text-lg text-white">Profile</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Update your personal account information.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 text-xl font-bold text-white shadow-lg shadow-green-500/25">
              {getInitials(name)}
            </div>
            <Button variant="outline" size="sm" className="rounded-xl border-white/10 hover:bg-white/5 text-xs text-white">
              Change Avatar
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-xs">
              <Label htmlFor="name" className="text-muted-foreground font-semibold">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl border-white/10 bg-white/5 text-white"
              />
            </div>
            <div className="space-y-2 text-xs">
              <Label htmlFor="email" className="text-muted-foreground font-semibold">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-white/10 bg-white/5 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="bg-white/5 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/5 pb-4">
          <CardTitle className="text-lg text-white">Appearance</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Customize how DONETO looks on your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between rounded-2xl p-4 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">Dark Theme Mode</p>
                <p className="text-muted-foreground mt-0.5">
                  Toggle between light and dark UI themes
                </p>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) =>
                setTheme(checked ? 'dark' : 'light')
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="bg-white/5 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/5 pb-4">
          <CardTitle className="text-lg text-white">Preferences</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Configure your language and notification settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between rounded-2xl p-4 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <Globe className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">Language</p>
                <p className="text-muted-foreground mt-0.5">
                  Select your preferred workspace language
                </p>
              </div>
            </div>
            <Select defaultValue="en">
              <SelectTrigger className="w-36 rounded-xl border-white/10 bg-zinc-900 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-slate-900 text-white">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ur">Urdu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-2xl p-4 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <Save className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">Email Notifications</p>
                <p className="text-muted-foreground mt-0.5">
                  Receive emails about your account activity
                </p>
              </div>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-11 gap-2 px-8 font-semibold rounded-xl shadow-md"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* --------------------- KYC WIZARD DIALOG (NGO ONLY) --------------------- */}
      <Dialog open={isKycModalOpen} onOpenChange={setIsKycModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background border-border text-foreground rounded-2xl shadow-2xl p-0 flex flex-col no-scrollbar">
          
          <DialogHeader className="p-6 bg-muted/40 border-b border-border shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#185500] dark:text-white">
              <Sparkles className="h-5 w-5 text-[#185500] dark:text-white animate-pulse" />
              NGO KYC Registration
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Step {kycStep} of 4: Fill in legal credentials and attach verified certificates.
            </DialogDescription>
          </DialogHeader>

          {saving && uploadStatus && (
            <div className="p-6 bg-indigo-950/20 border-b border-white/5 text-center text-xs text-indigo-400 flex items-center justify-center gap-2 font-semibold">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{uploadStatus}</span>
            </div>
          )}

          <div className="p-6 flex-1 overflow-y-auto no-scrollbar text-xs">
            {kycStep === 1 && (
              /* STEP 1: ORGANIZATION INFO */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-muted-foreground">NGO Legal Registered Name</Label>
                  <Input 
                    value={ngoName}
                    onChange={(e) => setNgoName(e.target.value)}
                    placeholder="e.g. Edhi Welfare Foundation"
                    required
                    className="rounded-xl border-white/10 bg-white/5 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-muted-foreground">NGO Public Name (if different)</Label>
                  <Input 
                    value={publicName}
                    onChange={(e) => setPublicName(e.target.value)}
                    placeholder="e.g. Edhi Foundation"
                    className="rounded-xl border-white/10 bg-white/5 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-muted-foreground">Established Year</Label>
                  <Input 
                    type="number"
                    value={yearEst}
                    onChange={(e) => setYearEst(e.target.value)}
                    placeholder="e.g. 1951"
                    required
                    className="rounded-xl border-white/10 bg-white/5 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-muted-foreground">Mission Statement</Label>
                  <Input 
                    value={missionStatement}
                    onChange={(e) => setMissionStatement(e.target.value)}
                    placeholder="Provide a brief mission statement..."
                    className="rounded-xl border-white/10 bg-white/5 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-muted-foreground">Organization Description</Label>
                  <Textarea 
                    value={orgDesc}
                    onChange={(e) => setOrgDesc(e.target.value)}
                    placeholder="Describe your organization's history, scope, and past impact projects..."
                    required
                    className="rounded-xl border-white/10 bg-white/5 text-white min-h-[90px]"
                  />
                </div>
              </div>
            )}

            {kycStep === 2 && (
              /* STEP 2: REGISTRATION SETTINGS */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-muted-foreground">Registration Type</Label>
                    <Select value={regType} onValueChange={(val: any) => setRegType(val)}>
                      <SelectTrigger className="rounded-xl border-white/10 bg-white/5 text-white">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-white/10 bg-slate-900 text-white">
                        <SelectItem value="Society">Society</SelectItem>
                        <SelectItem value="Trust">Trust</SelectItem>
                        <SelectItem value="Section 42 Company">Section 42 Company</SelectItem>
                        <SelectItem value="Foundation">Foundation</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold text-muted-foreground">Registration Authority</Label>
                    <Input 
                      value={regAuthority}
                      onChange={(e) => setRegAuthority(e.target.value)}
                      placeholder="e.g. SWD Punjab"
                      required
                      className="rounded-xl border-white/10 bg-white/5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-muted-foreground">Registration Number</Label>
                    <Input 
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="e.g. SWD-12345"
                      required
                      className="rounded-xl border-white/10 bg-white/5 text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold text-muted-foreground">Registration Date</Label>
                    <Input 
                      type="date"
                      value={regDate}
                      onChange={(e) => setRegDate(e.target.value)}
                      required
                      className="rounded-xl border-white/10 bg-white/5 text-white"
                    />
                  </div>
                </div>

                {/* Focus Categories Checklist */}
                <div className="space-y-2">
                  <Label className="font-semibold text-muted-foreground block mb-1">Focus Areas / Activity Categories</Label>
                  {ngoCategories.length === 0 ? (
                    <p className="text-muted-foreground text-xs">Loading categories...</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 bg-white/5 border border-white/10 rounded-xl p-3 max-h-[140px] overflow-y-auto no-scrollbar">
                      {ngoCategories.map((cat) => {
                        const checked = selectedCats.includes(cat);
                        return (
                          <div 
                            key={cat} 
                            onClick={() => handleToggleCategory(cat)}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                              checked ? 'bg-primary/20 text-white' : 'hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <div className={`h-4 w-4 border rounded flex items-center justify-center ${
                              checked ? 'border-primary bg-primary text-white' : 'border-white/20'
                            }`}>
                              {checked && <Check className="h-3 w-3" />}
                            </div>
                            <span className="text-[11px] truncate">{cat}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {kycStep === 3 && (
              /* STEP 3: REPRESENTATIVE DETAILS */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-muted-foreground">Representative Full Name</Label>
                  <Input 
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                    placeholder="Full name of signatory representative..."
                    required
                    className="rounded-xl border-white/10 bg-white/5 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-muted-foreground">Representative Designation</Label>
                  <Input 
                    value={repDesignation}
                    onChange={(e) => setRepDesignation(e.target.value)}
                    placeholder="e.g. Director Welfare, Trustee"
                    required
                    className="rounded-xl border-white/10 bg-white/5 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-muted-foreground">Representative CNIC Number (13 digits)</Label>
                  <Input 
                    value={cnicNumber}
                    onChange={(e) => setCnicNumber(e.target.value)}
                    placeholder="e.g. 4210112345678"
                    maxLength={13}
                    required
                    className="rounded-xl border-white/10 bg-white/5 text-white"
                  />
                </div>
              </div>
            )}

            {kycStep === 4 && (
              /* STEP 4: FILE UPLOADS */
              <div className="space-y-4">
                <span className="font-bold text-indigo-400 block mb-1">Attached verification files (PDF or Images)</span>
                
                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  {/* File 1: Logo */}
                  <div className="space-y-1">
                    <Label className="font-semibold text-muted-foreground">NGO Logo (Required)</Label>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5">
                      <UploadCloud className="h-6 w-6 text-indigo-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                          className="w-full text-xs text-slate-300"
                        />
                        <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{logoFile ? logoFile.name : 'Select JPG/PNG image'}</p>
                      </div>
                    </div>
                  </div>

                  {/* File 2: Reg Cert */}
                  <div className="space-y-1">
                    <Label className="font-semibold text-muted-foreground">Registration Certificate (Required)</Label>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5">
                      <UploadCloud className="h-6 w-6 text-indigo-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <input 
                          type="file" 
                          accept=".pdf,image/*"
                          onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                          className="w-full text-xs text-slate-300"
                        />
                        <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{certFile ? certFile.name : 'Select PDF or Certificate image'}</p>
                      </div>
                    </div>
                  </div>

                  {/* File 3: NTN Cert */}
                  <div className="space-y-1">
                    <Label className="font-semibold text-muted-foreground">NTN Certificate (Optional)</Label>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5">
                      <UploadCloud className="h-6 w-6 text-indigo-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <input 
                          type="file" 
                          accept=".pdf,image/*"
                          onChange={(e) => setNtnFile(e.target.files?.[0] || null)}
                          className="w-full text-xs text-slate-300"
                        />
                        <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{ntnFile ? ntnFile.name : 'Select NTN file'}</p>
                      </div>
                    </div>
                  </div>

                  {/* File 4: CNIC Front */}
                  <div className="space-y-1">
                    <Label className="font-semibold text-muted-foreground">CNIC Front Side (Required)</Label>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5">
                      <UploadCloud className="h-6 w-6 text-indigo-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => setCnicFrontFile(e.target.files?.[0] || null)}
                          className="w-full text-xs text-slate-300"
                        />
                        <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{cnicFrontFile ? cnicFrontFile.name : 'Select front side image'}</p>
                      </div>
                    </div>
                  </div>

                  {/* File 5: CNIC Back */}
                  <div className="space-y-1">
                    <Label className="font-semibold text-muted-foreground">CNIC Back Side (Required)</Label>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5">
                      <UploadCloud className="h-6 w-6 text-indigo-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => setCnicBackFile(e.target.files?.[0] || null)}
                          className="w-full text-xs text-slate-300"
                        />
                        <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{cnicBackFile ? cnicBackFile.name : 'Select back side image'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dialog Action Buttons */}
          <DialogFooter className="p-4 bg-slate-900/50 border-t border-white/10 flex justify-between items-center shrink-0 flex-row gap-2">
            <div className="flex gap-2">
              {kycStep > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setKycStep(kycStep - 1)}
                  disabled={saving}
                  className="rounded-xl flex items-center gap-1.5 h-10 px-4"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsKycModalOpen(false)}
                className="rounded-xl text-xs h-10"
              >
                Cancel
              </Button>
              {kycStep < 4 ? (
                <Button 
                  type="button" 
                  onClick={() => {
                    // Basic validation before going to next step
                    if (kycStep === 1 && (!ngoName.trim() || !yearEst || !orgDesc.trim())) {
                      toast.error('Please fill in all required fields.');
                      return;
                    }
                    if (kycStep === 2 && (!regType || !regAuthority.trim() || !regNumber.trim() || !regDate || selectedCats.length === 0)) {
                      toast.error('All registration details and categories are required.');
                      return;
                    }
                    if (kycStep === 3 && (!repName.trim() || !repDesignation.trim() || !cnicNumber.trim() || cnicNumber.trim().length < 13)) {
                      toast.error('Full representative details are required (CNIC must be 13 digits).');
                      return;
                    }
                    setKycStep(kycStep + 1);
                  }}
                  className="font-semibold rounded-xl flex items-center gap-1.5 h-10 px-4"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleKycSubmit}
                  disabled={saving}
                  className="font-semibold rounded-xl px-5 h-10 shadow-md"
                >
                  {saving ? 'Uploading...' : 'Submit Verification'}
                </Button>
              )}
            </div>
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </div>
  );
}
