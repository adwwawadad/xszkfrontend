'use server';

import { cookies } from 'next/headers';
import { connectMongoDB, Admin } from '@/lib/models';
import { createHash } from 'crypto';

// Şifre hashleme fonksiyonu
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Otomatik admin kurulumu yapan fonksiyon
export async function setupAdminIfNeeded() {
  try {
    console.log('[AdminActions] Admin kurulumu kontrol ediliyor...');
    await connectMongoDB();
    
    // Admin sayısını kontrol et
    const adminCount = await Admin.countDocuments();
    console.log(`[AdminActions] Mevcut admin sayısı: ${adminCount}`);
    
    if (adminCount > 0) {
      console.log('[AdminActions] Zaten admin kullanıcısı mevcut.');
      return { 
        success: true, 
        message: 'Zaten admin kullanıcısı mevcut',
        adminExists: true
      };
    }
    
    // Default admin bilgilerini al
    const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123!';
    
    console.log(`[AdminActions] Yeni admin oluşturuluyor: ${defaultAdminUsername}`);
    
    // Şifreyi hashle
    const hashedPassword = hashPassword(defaultAdminPassword);
    
    // Yeni admin kullanıcısı oluştur
    const newAdmin = new Admin({
      username: defaultAdminUsername,
      password: hashedPassword,
      isActive: true,
      createdAt: new Date()
    });
    
    // Veritabanına kaydet
    await newAdmin.save();
    
    console.log('[AdminActions] Yeni admin kullanıcısı başarıyla oluşturuldu!');
    
    return { 
      success: true, 
      message: 'Admin kullanıcısı oluşturuldu',
      adminExists: true,
      adminUsername: defaultAdminUsername,
      adminPassword: defaultAdminPassword // Development/test için şifreyi gösterme amaçlı
    };
  } catch (error: any) {
    console.error('[AdminActions] Admin kurulumu hatası:', error);
    return { 
      success: false, 
      message: 'Admin kurulumu sırasında hata: ' + error.message,
      adminExists: false
    };
  }
}

// Admin girişi
export async function loginAdmin(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  
  if (!username || !password) {
    return { 
      success: false, 
      message: 'Kullanıcı adı ve şifre gereklidir',
      redirect: false
    };
  }
  
  try {
    await connectMongoDB();
    
    // Admin kurulumunu kontrol et - hiç admin yoksa otomatik oluştur
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0 && process.env.AUTO_SETUP === 'true') {
      console.log('[AdminLogin] Admin bulunamadı, otomatik kurulum yapılıyor...');
      await setupAdminIfNeeded();
    }
    
    // Şifreyi hashle
    const hashedPassword = hashPassword(password);
    
    // Kullanıcıyı bul
    const admin = await Admin.findOne({ 
      username, 
      password: hashedPassword,
      isActive: true 
    });
    
    if (!admin) {
      return { 
        success: false, 
        message: 'Geçersiz kullanıcı adı veya şifre',
        redirect: false
      };
    }
    
    // Oturum oluştur
    cookies().set('admin_session', admin._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 gün
      path: '/'
    });
    
    // Redirect yapmak yerine başarı bilgisi dön, client tarafında yönlendirme yap
    return { 
      success: true, 
      message: 'Giriş başarılı',
      redirect: true,
      redirectUrl: '/admin/sistem'
    };
  } catch (error: any) {
    console.error('Admin login error:', error);
    return { 
      success: false, 
      message: 'Sunucu hatası: ' + error.message,
      redirect: false
    };
  }
} 