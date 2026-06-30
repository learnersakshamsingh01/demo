import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SapLogo } from "@/components/SapLogo";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/app");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left: visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/1089438/pexels-photo-1089438.jpeg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-[#008FD3]/30" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <SapLogo size="md" className="[&_span:first-child]:text-white [&_span:last-child]:text-white" />
          <div>
            <h2 className="font-heading text-4xl font-bold leading-tight">
              Code ABAP, faster.<br />Ship S/4HANA with confidence.
            </h2>
            <p className="mt-4 text-white/80 max-w-md">
              Your AI Copilot for SAP development. Trained for ABAP, CDS, and RAP — ready in your browser.
            </p>
          </div>
          <div className="text-xs text-white/60">© 2026 SAP Copilot</div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <SapLogo size="md" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Sign in</h1>
          <p className="mt-2 text-gray-600">Welcome back. Let us write some ABAP.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1.5 rounded-md border-gray-300 focus:ring-2 focus:ring-[#008FD3] focus:border-[#008FD3] h-11"
                data-testid="login-email-input"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 rounded-md border-gray-300 focus:ring-2 focus:ring-[#008FD3] focus:border-[#008FD3] h-11"
                data-testid="login-password-input"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#008FD3] hover:bg-[#0073AA] text-white rounded-md font-medium"
              data-testid="login-submit-button"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-gray-600">
            No account?{" "}
            <Link to="/register" className="text-[#008FD3] font-medium hover:underline" data-testid="login-to-register-link">
              Create one
            </Link>
          </p>
          <p className="mt-3 text-sm text-gray-500">
            <Link to="/" className="hover:underline">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
