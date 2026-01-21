"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#f7f5f3] flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex h-screen">
        <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[#37322f] to-[#5a534e] items-center justify-center p-12 sticky top-0 h-screen">
          <div className="max-w-lg text-white space-y-8">
            <div>
              <h2 className="text-4xl font-semibold mb-4 font-serif">
                Professional Podcast Recording Made Simple
              </h2>
              <p className="text-white/80 text-lg leading-relaxed">
                Record studio-quality podcasts with remote guests. AI-powered
                editing, one-click distribution to all platforms, and unlimited
                recording hours.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Studio-Quality Audio</h3>
                  <p className="text-white/70 text-sm">
                    Crystal-clear recording with noise cancellation
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Remote Interviews</h3>
                  <p className="text-white/70 text-sm">
                    Record with guests anywhere via browser
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Save 15+ Hours Weekly</h3>
                  <p className="text-white/70 text-sm">
                    No more manual research
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10">
              <p className="text-white/60 text-sm mb-4">
                Trusted by leading companies
              </p>
              <div className="flex gap-8 items-center opacity-60">
                <div className="text-2xl font-bold">Company</div>
                <div className="text-2xl font-bold">Brand</div>
                <div className="text-2xl font-bold">Corp</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-12 lg:px-12">
          <div className="w-full max-w-md">
            {/* Card */}
            <div className="bg-white rounded-2xl shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] border border-[rgba(2,6,23,0.08)] p-8 lg:shadow-none lg:border-0">
              {/* Tabs */}
              <div className="flex gap-2 mb-8 bg-[#f7f5f3] rounded-lg p-1">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    isLogin
                      ? "bg-white text-[#37322f] shadow-sm"
                      : "text-[#37322f]/60 hover:text-[#37322f]"
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    !isLogin
                      ? "bg-white text-[#37322f] shadow-sm"
                      : "text-[#37322f]/60 hover:text-[#37322f]"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-[#37322f] mb-2">
                  {isLogin ? "Welcome back" : "Create your account"}
                </h1>
                <p className="text-[#37322f]/60 text-sm">
                  {isLogin
                    ? "Enter your credentials to access your account"
                    : "Get started with Nova today"}
                </p>
              </div>

              {/* Social Login */}
              <div className="space-y-3 mb-6">
                <Button
                  variant="outline"
                  className="w-full h-11 border-[rgba(2,6,23,0.08)] hover:bg-[#f7f5f3] text-[#37322f] font-medium"
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
                  Continue with Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 border-[rgba(2,6,23,0.08)] hover:bg-[#f7f5f3] text-[#37322f] font-medium"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  Continue with GitHub
                </Button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <Separator className="bg-[rgba(2,6,23,0.08)]" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-[#37322f]/60">
                  OR
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-[#37322f] font-medium text-sm"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-11 border-[rgba(2,6,23,0.08)] focus:border-[#37322f] focus:ring-[#37322f]"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-[#37322f] font-medium text-sm"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 border-[rgba(2,6,23,0.08)] focus:border-[#37322f] focus:ring-[#37322f]"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-[#37322f] font-medium text-sm"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 border-[rgba(2,6,23,0.08)] focus:border-[#37322f] focus:ring-[#37322f]"
                  />
                </div>

                {isLogin && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-[#37322f]/60">
                      <input
                        type="checkbox"
                        className="rounded border-[rgba(2,6,23,0.08)] text-[#37322f] focus:ring-[#37322f]"
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      className="text-[#37322f] hover:text-[#37322f]/80 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {!isLogin && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-[#37322f] font-medium text-sm"
                    >
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="h-11 border-[rgba(2,6,23,0.08)] focus:border-[#37322f] focus:ring-[#37322f]"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#37322f] hover:bg-[#37322f]/90 text-white font-medium mt-6"
                >
                  {isLogin ? "Log In" : "Create Account"}
                </Button>
              </form>

              {/* Terms */}
              {!isLogin && (
                <p className="text-center text-xs text-[#37322f]/60 mt-4">
                  By signing up, you agree to our{" "}
                  <button className="text-[#37322f] hover:underline">
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button className="text-[#37322f] hover:underline">
                    Privacy Policy
                  </button>
                </p>
              )}
            </div>

            {/* Footer Text */}
            <p className="text-center text-sm text-[#37322f]/60 mt-6">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#37322f] hover:underline font-medium"
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
