"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { StudentCreate } from "@/types/student";
import { 
  User, 
  GraduationCap, 
  PhoneCall, 
  FileCheck2, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Upload,
  AlertCircle,
  UserCheck,
  Building,
  Image as ImageIcon
} from "lucide-react";
import ImagePreviewModal from "./ImagePreviewModal";

interface StudentAdmissionFormProps {}

export default function StudentAdmissionForm({}: StudentAdmissionFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [autoGrNo, setAutoGrNo] = useState<string>("GR-2026-0001");

  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    url: string | null;
    title: string;
  }>({
    isOpen: false,
    url: null,
    title: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State containing all fields from official Indian application form
  const [formData, setFormData] = useState<StudentCreate>({
    gr_no: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    mother_name: "",
    address: "",
    pin_code: "",
    phone: "",
    email: "",
    place_of_birth: "",
    dob: "",
    aadhar_no: "",
    gender: "Male",
    religion: "Non-Minority",
    category: "OPEN",
    photo_url: "",
    signature_url: "",
    aadhar_front_url: "",
    aadhar_back_url: "",
    division: "School Section",
    standard: "7th",
    section: "A",
    stream: undefined,
    academic_year: "2026-2027",
  });

  // Photo, Signature & Aadhar preview placeholders
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [aadharFrontPreview, setAadharFrontPreview] = useState<string | null>(null);
  const [aadharBackPreview, setAadharBackPreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNextGr() {
      try {
        const res = await api.get("/students/next-gr");
        if (res.data && res.data.next_gr_no) {
          setAutoGrNo(res.data.next_gr_no);
          setFormData((prev) => ({ ...prev, gr_no: res.data.next_gr_no }));
        }
      } catch (err) {
        setAutoGrNo("GR-2026-0005");
        setFormData((prev) => ({ ...prev, gr_no: "GR-2026-0005" }));
      }
    }
    fetchNextGr();
  }, []);

  const handleDivisionChange = (division: string) => {
    let defaultStd = "1st";
    let defaultStream: string | undefined = undefined;

    if (division === "Pre-Primary") {
      defaultStd = "Nursery";
    } else if (division === "School Section") {
      defaultStd = "1st";
    } else if (division === "Junior College") {
      defaultStd = "11th";
      defaultStream = "Science";
    }

    setFormData({
      ...formData,
      division,
      standard: defaultStd,
      stream: defaultStream,
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        setFormData((prev) => ({ ...prev, photo_url: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSignaturePreview(base64);
        setFormData((prev) => ({ ...prev, signature_url: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAadharFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAadharFrontPreview(base64);
        setFormData((prev) => ({ ...prev, aadhar_front_url: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAadharBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAadharBackPreview(base64);
        setFormData((prev) => ({ ...prev, aadhar_back_url: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateCurrentStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.mother_name.trim()) {
        setErrorMsg("Please fill in Candidate First Name, Last Name, and Mother's Name before proceeding.");
        return false;
      }
    } else if (step === 2) {
      if (!formData.place_of_birth.trim() || !formData.dob.trim() || !formData.aadhar_no.trim()) {
        setErrorMsg("Please fill in Place of Birth, Date of Birth, and Aadhar Number before proceeding.");
        return false;
      }
    } else if (step === 3) {
      if (!formData.address.trim() || !formData.pin_code.trim() || !formData.phone.trim()) {
        setErrorMsg("Please fill in Residential Address, Pin Code, and Primary Mobile Number before proceeding.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(5, prev + 1));
    }
  };

  const handleFinalRegistration = async () => {
    if (step !== 5) {
      return;
    }
    if (!validateCurrentStep()) {
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.post("/students/register", formData);
      if (res.data && res.data.id) {
        router.push("/students");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to submit admission form. Please check all fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-8">
      {/* Wizard Step Bar */}
      <div>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
          
          {[
            { num: 1, label: "Candidate Info", icon: User },
            { num: 2, label: "Identity & Religion", icon: UserCheck },
            { num: 3, label: "Address & Contact", icon: PhoneCall },
            { num: 4, label: "Academic Division", icon: GraduationCap },
            { num: 5, label: "Photo & Review", icon: FileCheck2 },
          ].map((item) => {
            const Icon = item.icon;
            const isDone = step > item.num;
            const isCurrent = step === item.num;
            return (
              <div key={item.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isDone
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                      : isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-lg shadow-blue-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`mt-2 text-[11px] font-semibold ${
                    isCurrent ? "text-blue-400" : isDone ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Content */}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleFinalRegistration();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
            e.preventDefault();
          }
        }}
      >
        {/* STEP 1: Name Breakdown (4a, 4b, 4c, 4d) */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">4. Candidate Full Name Breakdown</h3>
                <p className="text-xs text-slate-400">Official name as per Birth Certificate / Aadhar</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-semibold">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Auto GR No: {autoGrNo}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 4a Last Name / Surname */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  4a. Last Name / Surname *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PATEL"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white uppercase tracking-wide focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
              </div>

              {/* 4b Candidate's First Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  4b. Candidate's First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AARAV"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white uppercase tracking-wide focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
              </div>

              {/* 4c Middle / Father's Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  4c. Middle / Father's Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. ANIKET"
                  value={formData.middle_name || ""}
                  onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white uppercase tracking-wide focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
              </div>

              {/* 4d Mother's Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  4d. Mother's Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUNITA"
                  value={formData.mother_name}
                  onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white uppercase tracking-wide focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
              </div>
            </div>

            {/* Computed Name Preview */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <span>Full Name Preview:</span>
              <span className="font-bold text-blue-400 font-mono">
                {formData.first_name} {formData.middle_name} {formData.last_name}
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: Birth, Aadhar, Religion & Category (7 - 12) */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">7 - 12. Identity, Religion & Category</h3>
              <p className="text-xs text-slate-400">Official Indian demographic classification</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 7 Place of Birth */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  7. Place of Birth *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MUMBAI"
                  value={formData.place_of_birth}
                  onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              {/* 8 Date of Birth */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  8. Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              {/* 9 Aadhar No */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  9. Aadhar Number (12 Digits) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={14}
                  placeholder="1234-5678-9012"
                  value={formData.aadhar_no}
                  onChange={(e) => setFormData({ ...formData, aadhar_no: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500 text-sm tracking-widest"
                />
              </div>

              {/* 10 Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  10. Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="Male">1) Male</option>
                  <option value="Female">2) Female</option>
                  <option value="Trans Gender">3) Trans Gender</option>
                </select>
              </div>

              {/* 11 Minority Religion */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  11. Minority Religion *
                </label>
                <select
                  value={formData.religion}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="Non-Minority">0) Non-Minority</option>
                  <option value="Muslim">1) Muslim</option>
                  <option value="Christian">2) Christian</option>
                  <option value="Buddhist">3) Buddhist</option>
                  <option value="Sikh">4) Sikh</option>
                  <option value="Parsi">5) Parsi</option>
                  <option value="Jain">6) Jain</option>
                </select>
              </div>

              {/* 12 Caste Category */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  12. Caste Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="SC">1) SC</option>
                  <option value="ST">2) ST</option>
                  <option value="VJ(A)">3) VJ(A)</option>
                  <option value="NT(B)">4) NT(B)</option>
                  <option value="NT(C)">5) NT(C)</option>
                  <option value="NT(D)">6) NT(D)</option>
                  <option value="OBC">7) OBC</option>
                  <option value="SBC">8) SBC</option>
                  <option value="OPEN">9) OPEN</option>
                  <option value="MARATHA">10) MARATHA (ESBC)</option>
                  <option value="MUSLIM (SBC-A)">11) MUSLIM (SBC-A)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Address & Contact (5 & 6) */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">5 & 6. Residential Address & Contact</h3>
              <p className="text-xs text-slate-400">Communication details and Pin Code</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 5 Residential Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  5. Residential Address *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Flat / House No, Street, Landmark, City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              {/* Pin Code Box */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Pin Code (6 Digits) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 400001"
                  value={formData.pin_code}
                  onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500 text-sm tracking-widest"
                />
              </div>

              {/* 6 Mobile No */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  6. Primary Mobile No *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="e.g. 9820123456"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              {/* Email Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="parent@example.com"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Academic Setup */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Academic Division & Stream Setup</h3>
              <p className="text-xs text-slate-400">Class, Section & Stream assignment</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Academic Division *
                </label>
                <select
                  value={formData.division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="Pre-Primary">Pre-Primary (CBSE Pattern)</option>
                  <option value="School Section">School Section (1st - 10th)</option>
                  <option value="Junior College">Junior College (11th & 12th)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Class / Standard *
                </label>
                <select
                  value={formData.standard}
                  onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  {formData.division === "Pre-Primary" && (
                    <>
                      <option value="Nursery">Nursery</option>
                      <option value="Jr. KG">Jr. KG</option>
                      <option value="Sr. KG">Sr. KG</option>
                    </>
                  )}
                  {formData.division === "School Section" && (
                    <>
                      <option value="1st">1st Standard</option>
                      <option value="2nd">2nd Standard</option>
                      <option value="3rd">3rd Standard</option>
                      <option value="4th">4th Standard</option>
                      <option value="5th">5th Standard</option>
                      <option value="6th">6th Standard</option>
                      <option value="7th">7th Standard</option>
                      <option value="8th">8th Standard</option>
                      <option value="9th">9th Standard</option>
                      <option value="10th">10th Standard</option>
                    </>
                  )}
                  {formData.division === "Junior College" && (
                    <>
                      <option value="11th">11th Standard</option>
                      <option value="12th">12th Standard</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Section *
                </label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="A">Division A</option>
                  <option value="B">Division B</option>
                  <option value="C">Division C</option>
                </select>
              </div>
            </div>

            {formData.division === "Junior College" && (
              <div className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <GraduationCap className="w-5 h-5" />
                  <span>Junior College Stream Selection</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {["Science", "Commerce", "Arts"].map((str) => (
                    <button
                      key={str}
                      type="button"
                      onClick={() => setFormData({ ...formData, stream: str })}
                      className={`p-3 rounded-xl font-bold text-sm border transition-all ${
                        formData.stream === str
                          ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30"
                          : "bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      {str} Stream
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Photo, Signature & Review */}
        {step === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Photo, Signature & Review</h3>
              <p className="text-xs text-slate-400">Verify details and candidate signature</p>
            </div>
            {/* Photo & Signature Upload Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Photo Upload Box */}
              <div className="p-4 bg-slate-900 border border-dashed border-slate-700 rounded-xl text-center flex flex-col items-center justify-center space-y-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase">CANDIDATE PHOTO *</span>
                {photoPreview ? (
                  <div
                    onClick={() => setPreviewModal({ isOpen: true, url: photoPreview, title: "Candidate Photo" })}
                    className="group relative cursor-pointer overflow-hidden rounded border border-slate-600 shadow transition-all hover:scale-105"
                    title="Click to view full resolution"
                  >
                    <img src={photoPreview} alt="Candidate Photo" className="w-24 h-28 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition-opacity">
                      View Resolution
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-28 bg-slate-950 border border-slate-800 rounded flex items-center justify-center text-slate-600 text-xs">
                    Passport Size
                  </div>
                )}
                <label className="cursor-pointer px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors">
                  Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>

              {/* Signature Upload Box */}
              <div className="p-4 bg-slate-900 border border-dashed border-slate-700 rounded-xl text-center flex flex-col items-center justify-center space-y-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase">SIGNATURE *</span>
                {signaturePreview ? (
                  <div
                    onClick={() => setPreviewModal({ isOpen: true, url: signaturePreview, title: "Candidate Signature" })}
                    className="group relative cursor-pointer overflow-hidden rounded border border-slate-600 bg-white p-1 shadow transition-all hover:scale-105"
                    title="Click to view full resolution"
                  >
                    <img src={signaturePreview} alt="Candidate Signature" className="w-36 h-14 object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition-opacity">
                      View Resolution
                    </div>
                  </div>
                ) : (
                  <div className="w-36 h-14 bg-slate-950 border border-slate-800 rounded flex items-center justify-center text-slate-600 text-xs">
                    Signature
                  </div>
                )}
                <label className="cursor-pointer px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors">
                  Upload Signature
                  <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                </label>
              </div>

              {/* Optional Aadhar Card Front Upload Box */}
              <div className="p-4 bg-slate-900 border border-dashed border-slate-700 rounded-xl text-center flex flex-col items-center justify-center space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase">AADHAR FRONT (OPTIONAL)</span>
                {aadharFrontPreview ? (
                  <div
                    onClick={() => setPreviewModal({ isOpen: true, url: aadharFrontPreview, title: "Aadhar Card Front Side" })}
                    className="group relative cursor-pointer overflow-hidden rounded border border-slate-600 shadow transition-all hover:scale-105"
                    title="Click to view full resolution"
                  >
                    <img src={aadharFrontPreview} alt="Aadhar Front" className="w-36 h-16 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition-opacity">
                      View Resolution
                    </div>
                  </div>
                ) : (
                  <div className="w-36 h-16 bg-slate-950 border border-slate-800 rounded flex items-center justify-center text-slate-600 text-[11px]">
                    Aadhar Front
                  </div>
                )}
                <label className="cursor-pointer px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition-colors">
                  Upload Front Side
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleAadharFrontUpload} />
                </label>
              </div>

              {/* Optional Aadhar Card Back Upload Box */}
              <div className="p-4 bg-slate-900 border border-dashed border-slate-700 rounded-xl text-center flex flex-col items-center justify-center space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase">AADHAR BACK (OPTIONAL)</span>
                {aadharBackPreview ? (
                  <div
                    onClick={() => setPreviewModal({ isOpen: true, url: aadharBackPreview, title: "Aadhar Card Back Side" })}
                    className="group relative cursor-pointer overflow-hidden rounded border border-slate-600 shadow transition-all hover:scale-105"
                    title="Click to view full resolution"
                  >
                    <img src={aadharBackPreview} alt="Aadhar Back" className="w-36 h-16 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition-opacity">
                      View Resolution
                    </div>
                  </div>
                ) : (
                  <div className="w-36 h-16 bg-slate-950 border border-slate-800 rounded flex items-center justify-center text-slate-600 text-[11px]">
                    Aadhar Back
                  </div>
                )}
                <label className="cursor-pointer px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition-colors">
                  Upload Back Side
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleAadharBackUpload} />
                </label>
              </div>
            </div>

            {/* Summary Review Card */}
            <div className="p-5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Application Review Summary
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Candidate Name:</span>
                  <span className="font-bold text-white">
                    {formData.first_name} {formData.middle_name} {formData.last_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mother's Name:</span>
                  <span className="font-bold text-white">{formData.mother_name || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Aadhar No:</span>
                  <span className="font-mono font-bold text-white">{formData.aadhar_no || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Category / Religion:</span>
                  <span className="font-bold text-amber-400">
                    {formData.category} ({formData.religion})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Division & Standard:</span>
                  <span className="font-bold text-white">
                    {formData.division} - Std {formData.standard} ({formData.section})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mobile No:</span>
                  <span className="font-bold text-white">{formData.phone || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Pin Code:</span>
                  <span className="font-bold text-white">{formData.pin_code || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">GR Number:</span>
                  <span className="font-mono font-bold text-blue-400">{autoGrNo}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous Step
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalRegistration}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Registering Candidate...</span>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Submit Application & Generate GR</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>

      <ImagePreviewModal
        isOpen={previewModal.isOpen}
        imageUrl={previewModal.url}
        title={previewModal.title}
        onClose={() => setPreviewModal({ isOpen: false, url: null, title: "" })}
      />
    </div>
  );
}
