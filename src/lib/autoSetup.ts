import crypto from 'crypto';
import { connectMongoDB } from '@/lib/models';

/**
 * Uygulamanın başlangıcında veritabanı kontrolü yapan fonksiyon
 * Admin oluşturma artık burada gerçekleştirilmeyecek, onun yerine 
 * admin sayfasında yapılacak
 */
export async function autoSetupAdmin(): Promise<void> {
  try {
    // Build zamanında çalışmasını engelle
    if (typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('[AutoSetup] Build modu tespit edildi, kurulum atlanıyor.');
      return;
    }
    
    // AUTO_SETUP false ise çalışma
    if (process.env.AUTO_SETUP !== 'true') {
      console.log('[AutoSetup] Otomatik kurulum devre dışı (AUTO_SETUP=false)');
      return;
    }

    console.log('[AutoSetup] MongoDB bağlantısı kontrol ediliyor...');
    
    // Client tarafında mı çalışıyor?
    const isClient = typeof window !== 'undefined';
    
    if (isClient) {
      // Client tarafında bir işlem yapmaya gerek yok
      console.log('[AutoSetup] Client tarafında çalışıyor, veritabanı kontrolü atlanıyor.');
      return;
    }
    
    // Server tarafında - bağlantıyı test et
    try {
      await connectMongoDB();
      console.log('[AutoSetup] MongoDB bağlantısı başarılı!');
    } catch (dbError) {
      console.error('[AutoSetup] MongoDB bağlantı hatası:', dbError);
    }
  } catch (error) {
    console.error('[AutoSetup] Genel hata:', error);
  }
}

/**
 * Rastgele bir setup token oluşturur.
 * Bu token, .env dosyasına SETUP_TOKEN olarak eklenebilir.
 */
export function generateSetupToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Rastgele bir admin şifresi oluşturur.
 * Bu şifre, .env dosyasına DEFAULT_ADMIN_PASSWORD olarak eklenebilir.
 */
export function generateSecurePassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  
  return password;
}

// Eğer token oluşturma fonksiyonu doğrudan çalıştırılırsa, bir örnek token ve şifre üretebilir
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  const exampleToken = generateSetupToken();
  const examplePassword = generateSecurePassword();
  
  console.log('\n=== Güvenlik Ayarları Örneği ===');
  console.log(`SETUP_TOKEN=${exampleToken}`);
  console.log(`DEFAULT_ADMIN_PASSWORD=${examplePassword}`);
  console.log('==============================\n');
} 