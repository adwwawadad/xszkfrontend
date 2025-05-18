"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAdmin, setupAdminIfNeeded } from "./actions";

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setupInfo, setSetupInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Sayfa yüklendiğinde admin kurulumunu kontrol et
  useEffect(() => {
    async function checkSetup() {
      try {
        setIsChecking(true);
        const result = await setupAdminIfNeeded();
        
        if (result.success && !result.adminExists) {
          setSetupInfo(result);
          // Yeni oluşturulan admin bilgilerini form'a otomatik doldur
          if (result.adminUsername) {
            setUsername(result.adminUsername);
          }
          toast({
            title: "Admin Kullanıcısı Oluşturuldu",
            description: "İlk admin kullanıcısı otomatik olarak oluşturuldu. Lütfen giriş yapın.",
          });
        }
      } catch (error) {
        console.error("Admin kurulumu kontrolü sırasında hata:", error);
      } finally {
        setIsChecking(false);
      }
    }
    
    checkSetup();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Form verilerini oluştur
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      // Server action'ı çağır
      const result = await loginAdmin(formData);
      
      if (result.success) {
        toast({
          title: "Başarılı",
          description: result.message || "Giriş başarılı"
        });
        
        if (result.redirect) {
          // Başarılı giriş, yönlendirme yap
          router.push(result.redirectUrl || "/admin/sistem");
          router.refresh(); // Tüm sayfa state'ini yenile
        }
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: result.message || "Giriş başarısız"
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Beklenmeyen bir hata oluştu"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-[400px] p-6 space-y-8">
        {isChecking ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Admin kurulumu kontrol ediliyor...</p>
          </div>
        ) : (
          <>
            {setupInfo && setupInfo.adminUsername && setupInfo.adminPassword && (
              <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
                <h3 className="font-medium text-yellow-800 mb-2">Otomatik Admin Kurulumu Yapıldı</h3>
                <p className="text-sm text-yellow-700 mb-2">
                  Aşağıdaki bilgilerle giriş yapabilirsiniz:
                </p>
                <div className="text-sm text-yellow-900 bg-yellow-100 p-2 rounded border border-yellow-300 font-mono mb-1">
                  Kullanıcı Adı: <strong>{setupInfo.adminUsername}</strong>
                </div>
                <div className="text-sm text-yellow-900 bg-yellow-100 p-2 rounded border border-yellow-300 font-mono">
                  Şifre: <strong>{setupInfo.adminPassword}</strong>
                </div>
                <p className="text-xs text-yellow-600 mt-2">
                  Not: Bu bilgileri bir yere kaydedin ve güvenli bir şekilde saklayın!
                </p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Giriş Yap</h1>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Kullanıcı Adı</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="kullaniciadi"
                    required
                    disabled={isLoading}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.trim())}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Şifre</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      disabled={isLoading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Giriş yapılıyor...
                    </div>
                  ) : (
                    "Giriş Yap"
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}