import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mail, Lock, User, Building2, Phone, ArrowLeft } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"register" | "login">("register");

  // --- Registrazione ---
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    passwordConfirm: "",
    azienda: "",
    telefono: "",
  });

  const registrazione = trpc.auth.registrazione.useMutation({
    onSuccess: () => {
      toast.success("Registrazione completata! Reindirizzamento al portale...");
      setTimeout(() => setLocation("/portale"), 1500);
    },
    onError: (e: any) => toast.error(e.message || "Errore durante la registrazione"),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) { toast.error("Inserisci il tuo nome"); return; }
    if (!formData.email.includes("@")) { toast.error("Email non valida"); return; }
    if (formData.password.length < 8) { toast.error("Password deve essere almeno 8 caratteri"); return; }
    if (formData.password !== formData.passwordConfirm) { toast.error("Le password non corrispondono"); return; }
    if (!formData.azienda.trim()) { toast.error("Inserisci il nome dell'azienda"); return; }
    if (!formData.telefono.trim()) { toast.error("Inserisci il numero di telefono"); return; }
    registrazione.mutate({
      nome: formData.nome,
      email: formData.email,
      password: formData.password,
      azienda: formData.azienda,
      telefono: formData.telefono,
    });
  };

  // --- Login ---
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const utils = trpc.useUtils();

  const login = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Accesso effettuato! Reindirizzamento al portale...");
      utils.auth.me.invalidate();
      setTimeout(() => setLocation("/portale"), 1500);
    },
    onError: (e: any) => toast.error(e.message || "Email o password non corretti"),
  });

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setLoginData(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email.includes("@")) { toast.error("Email non valida"); return; }
    if (!loginData.password) { toast.error("Inserisci la password"); return; }
    login.mutate({ email: loginData.email, password: loginData.password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4a2e] to-[#0e3320] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Torna alla home</span>
          </button>
          <h1 className="text-4xl font-black text-white mb-2">
            {mode === "register" ? "Registrati" : "Accedi"}
          </h1>
          <p className="text-white/60 text-sm">
            {mode === "register" ? "Crea il tuo account installatore" : "Accedi al tuo account installatore"}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 py-2.5 text-sm font-bold transition-colors ${mode === "register" ? "bg-[#f5c518] text-[#1a4a2e]" : "bg-white/5 text-white/60 hover:text-white"}`}
          >
            Registrati
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2.5 text-sm font-bold transition-colors ${mode === "login" ? "bg-[#f5c518] text-[#1a4a2e]" : "bg-white/5 text-white/60 hover:text-white"}`}
          >
            Accedi
          </button>
        </div>

        {/* FORM REGISTRAZIONE */}
        {mode === "register" && (
          <form onSubmit={handleSubmitRegister} className="space-y-4">
            <div>
              <Label className="text-white/80 text-sm font-semibold mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome e Cognome
              </Label>
              <Input
                type="text"
                name="nome"
                placeholder="Mario Rossi"
                value={formData.nome}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 text-white placeholder:text-white/40 rounded-lg px-4 py-2.5"
              />
            </div>
            <div>
              <Label className="text-white/80 text-sm font-semibold mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                type="email"
                name="email"
                placeholder="mario@example.com"
                value={formData.email}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 text-white placeholder:text-white/40 rounded-lg px-4 py-2.5"
              />
            </div>
            <div>
              <Label className="text-white/80 text-sm font-semibold mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Azienda / Ragione Sociale
              </Label>
              <Input
                type="text"
                name="azienda"
                placeholder="Rossi Impianti Srl"
                value={formData.azienda}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 text-white placeholder:text-white/40 rounded-lg px-4 py-2.5"
              />
            </div>
            <div>
              <Label className="text-white/80 text-sm font-semibold mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefono
              </Label>
              <Input
                type="tel"
                name="telefono"
                placeholder="+39 123 456 7890"
                value={formData.telefono}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 text-white placeholder:text-white/40 rounded-lg px-4 py-2.5"
              />
            </div>
            <div>
              <Label className="text-white/80 text-sm font-semibold mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                type="password"
                name="password"
                placeholder="Almeno 8 caratteri"
                value={formData.password}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 text-white placeholder:text-white/40 rounded-lg px-4 py-2.5"
              />
            </div>
            <div>
              <Label className="text-white/80 text-sm font-semibold mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Conferma Password
              </Label>
              <Input
                type="password"
                name="passwordConfirm"
                placeholder="Ripeti la password"
                value={formData.passwordConfirm}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 text-white placeholder:text-white/40 rounded-lg px-4 py-2.5"
              />
            </div>
            <Button
              type="submit"
              disabled={registrazione.isPending}
              className="w-full bg-[#f5c518] hover:bg-[#f5c518]/90 text-[#1a4a2e] font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {registrazione.isPending ? "Registrazione in corso..." : "Registrati"}
            </Button>
            <div className="text-center">
              <p className="text-white/60 text-sm">
                Hai già un account?{" "}
                <button type="button" onClick={() => setMode("login")} className="text-[#f5c518] hover:text-[#f5c518]/80 font-semibold transition-colors">
                  Accedi
                </button>
              </p>
            </div>
          </form>
        )}

        {/* FORM LOGIN */}
        {mode === "login" && (
          <form onSubmit={handleSubmitLogin} className="space-y-4">
            <div>
              <Label className="text-white/80 text-sm font-semibold mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                type="email"
                name="email"
                placeholder="mario@example.com"
                value={loginData.email}
                onChange={handleLoginChange}
                className="bg-white/5 border border-white/10 text-white placeholder:text-white/40 rounded-lg px-4 py-2.5"
              />
            </div>
            <div>
              <Label className="text-white/80 text-sm font-semibold mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                type="password"
                name="password"
                placeholder="La tua password"
                value={loginData.password}
                onChange={handleLoginChange}
                className="bg-white/5 border border-white/10 text-white placeholder:text-white/40 rounded-lg px-4 py-2.5"
              />
            </div>
            <Button
              type="submit"
              disabled={login.isPending}
              className="w-full bg-[#f5c518] hover:bg-[#f5c518]/90 text-[#1a4a2e] font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {login.isPending ? "Accesso in corso..." : "Accedi"}
            </Button>
            <div className="text-center">
              <p className="text-white/60 text-sm">
                Non hai un account?{" "}
                <button type="button" onClick={() => setMode("register")} className="text-[#f5c518] hover:text-[#f5c518]/80 font-semibold transition-colors">
                  Registrati
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg">
          <p className="text-white/60 text-xs">
            I tuoi dati sono protetti e utilizzati solo per la gestione del tuo account.
          </p>
        </div>
      </div>
    </div>
  );
}
