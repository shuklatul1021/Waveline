"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in with credentials
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        // Register new user
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Registration failed");
        } else {
          // Auto sign in after registration
          const signInResult = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });

          if (signInResult?.error) {
            setError(signInResult.error);
          } else {
            router.push("/dashboard");
            router.refresh();
          }
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: "google" | "github") => {
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-[#F7F5F3] flex flex-col md:flex-row">
      {/* Left Side - Brand & Testimonial */}
      <div className="hidden lg:flex lg:w-1/2 h-screen sticky top-0 relative bg-[#37322F] overflow-hidden flex-col justify-between p-12 xl:p-16 text-white text-balance">
        {/* Background Enhancements */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div
          className="absolute top-0 left-0 w-full h-full opacity-10"
          style={{
            backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        ></div>

        {/* Top Content */}
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-sm font-medium text-white/90">
            Now Available
          </div>
          <h1 className="text-4xl xl:text-5xl font-serif leading-1.1">
            Reimagine how you record & publish podcasts.
          </h1>
          <p className="text-lg text-white/70 max-w-md leading-relaxed">
            Join thousands of creators who trust Waveline for studio-quality
            recording, AI editing, and instant distribution.
          </p>
        </div>

        {/* Bottom Testimonial */}
        <div className="relative z-10 bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg
                key={i}
                className="w-5 h-5 text-amber-400 fill-current"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <blockquote className="text-lg font-medium leading-relaxed mb-4">
            "Waveline cut my production time by 70%. The AI editing is like
            magic, and the audio quality is indistinguishable from a physical
            studio."
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-400 to-orange-400 rounded-full"></div>
            <div>
              <div className="font-semibold">Sarah Jenkins</div>
              <div className="text-sm text-white/60">
                Host of "Future Tech" • 150k+ Listeners
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 xl:p-24 relative overflow-hidden">
        {/* Mobile Background Decoration */}
        <div className="lg:hidden absolute inset-0 -z-10">
          {/* You can add a subtle gradient mesh here for mobile if needed, keeping it clean for now */}
        </div>

        <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-serif text-[#37322F]">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-[#605A57]">
              {isLogin
                ? "Enter your details to access your workspace."
                : "Get started with your 14-day free trial."}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Social Auth */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn("google")}
              disabled={loading}
              className="h-11 rounded-full border-[rgba(55,50,47,0.12)] hover:bg-[#37322F]/5 hover:text-[#37322F] text-[#605A57] font-medium transition-all"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn("github")}
              disabled={loading}
              className="h-11 rounded-full border-[rgba(55,50,47,0.12)] hover:bg-[#37322F]/5 hover:text-[#37322F] text-[#605A57] font-medium transition-all"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[rgba(55,50,47,0.1)]"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#F7F5F3] px-2 text-[#605A57]">
                Or continue with
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Toggle */}
            <div className="p-1.5 bg-[rgba(55,50,47,0.06)] rounded-xl flex gap-1 mb-6">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isLogin ? "bg-white text-[#37322F] shadow-sm" : "text-[#605A57] hover:text-[#37322F]"}`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${!isLogin ? "bg-white text-[#37322F] shadow-sm" : "text-[#605A57] hover:text-[#37322F]"}`}
              >
                Sign Up
              </button>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-[#37322F]"
                >
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="h-11 rounded-lg border-[rgba(55,50,47,0.12)] bg-white focus-visible:ring-[#37322F] focus-visible:ring-offset-0"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-[#37322F]"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 rounded-lg border-[rgba(55,50,47,0.12)] bg-white focus-visible:ring-[#37322F] focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-[#37322F]"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-lg border-[rgba(55,50,47,0.12)] bg-white focus-visible:ring-[#37322F] focus-visible:ring-offset-0"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#37322F] hover:bg-[#37322F]/90 text-white rounded-full font-medium text-base transition-all mt-4"
            >
              {loading
                ? "Please wait..."
                : isLogin
                  ? "Sign In"
                  : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-[#605A57]">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline hover:text-[#37322F]">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-[#37322F]">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
