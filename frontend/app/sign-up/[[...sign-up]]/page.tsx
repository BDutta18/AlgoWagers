import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#15161A] border border-white/10 shadow-2xl",
            headerTitle: "text-white font-logo tracking-widest",
            headerSubtitle: "text-white/60",
            socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10",
            formButtonPrimary: "bg-[#FF2A1E] hover:bg-[#D41F16] text-sm font-bold tracking-widest uppercase py-3",
            footerActionLink: "text-[#FF2A1E] hover:text-[#D41F16]",
            dividerLine: "bg-white/10",
            dividerText: "text-white/40",
            formFieldLabel: "text-white/80",
            formFieldInput: "bg-white/5 border-white/10 text-white",
          }
        }}
        signInUrl="/sign-in"
      />
    </div>
  );
}
