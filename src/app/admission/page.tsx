import StudentAdmissionForm from "@/components/StudentAdmissionForm";
import { UserPlus } from "lucide-react";

export const metadata = {
  title: "Student Admission & GR Tracking | School Management System",
};

export default function AdmissionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <UserPlus className="w-7 h-7 text-blue-400" />
            Student Admission Desk
          </h2>
          <p className="text-sm text-slate-400">
            Register new candidate with auto-generated General Register (GR) Number
          </p>
        </div>
      </div>

      <StudentAdmissionForm />
    </div>
  );
}
