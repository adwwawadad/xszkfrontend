import { NextResponse } from 'next/server';
import { connect, isConnected } from '@/lib/mongodb';
import { Admin } from '@/lib/models';
import { createHash } from 'crypto';

// API'nin dinamik olarak çalışmasını sağla
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Şifre hashleme fonksiyonu
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Güvenli gösterilebilir MongoDB URI oluştur
function getMaskedMongoURI() {
  const uri = process.env.MONGO_URI || '';
  if (!uri) return 'MONGO_URI not set';
  
  try {
    // URI'deki kullanıcı adı ve şifreyi maskele
    const maskedUri = uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)(@.+)/, '$1****:****$4');
    return maskedUri;
  } catch (error) {
    return 'Error masking URI';
  }
}

/**
 * GET /api/setup
 * 
 * İlk admin kullanıcısını oluşturmak için API
 * Bu fonksiyon, sadece admin kullanıcısı yoksa ve
 * development modunda çalışırken veya AUTO_SETUP true ise çalışır.
 */
export async function GET() {
  console.log('[Setup API] Setup çağrıldı');
  
  // MongoDB URI'nin tanımlı olup olmadığını kontrol et
  if (!process.env.MONGO_URI) {
    console.error('[Setup API] MONGO_URI tanımlı değil');
    return NextResponse.json({ 
      success: false, 
      message: 'MongoDB URI tanımlı değil. Lütfen MONGO_URI çevre değişkenini ayarlayın.',
      env: {
        NODE_ENV: process.env.NODE_ENV,
        HAS_MONGO_URI: !!process.env.MONGO_URI,
        PROJECT_ID: process.env.PROJECT_ID || 'tanımlı değil',
        AUTO_SETUP: process.env.AUTO_SETUP || 'tanımlı değil'
      }
    }, { status: 500 });
  }
  
  // Loglama için veritabanı bilgilerini hazırla (hassas bilgileri maskeleyerek)
  const dbInfo = {
    uri: getMaskedMongoURI(),
    dbName: process.env.USE_PROJECT_DB === 'true' 
      ? `${process.env.PROJECT_ID || 'default'}_db` 
      : 'normal_db',
    isConnected: isConnected(),
    env: process.env.NODE_ENV,
    autoSetup: process.env.AUTO_SETUP === 'true'
  };
  
  console.log('[Setup API] Veritabanı bilgileri:', dbInfo);

  try {
    // Sadece geliştirme modunda veya AUTO_SETUP etkinse çalış
    if (process.env.NODE_ENV !== 'development' && process.env.AUTO_SETUP !== 'true') {
      console.log('[Setup API] Geliştirme modu veya AUTO_SETUP etkin değil, erişim reddedildi');
      return NextResponse.json({ 
        success: false, 
        message: 'Bu endpoint sadece geliştirme modunda veya AUTO_SETUP=true olduğunda çalışır',
        dbInfo
      }, { status: 403 });
    }

    console.log('[Setup API] MongoDB bağlantısı kuruluyor...');
    
    // MongoDB'ye bağlan
    const client = await connect();
    
    // Veritabanı bağlantısını kontrol et
    if (!client) {
      console.error('[Setup API] MongoDB bağlantısı kurulamadı');
      return NextResponse.json({ 
        success: false, 
        message: 'MongoDB bağlantısı başarısız. Lütfen MONGO_URI adresini kontrol edin.',
        dbInfo
      }, { status: 500 });
    }
    
    console.log('[Setup API] MongoDB bağlantısı başarılı, admin kontrolü yapılıyor...');

    // Admin koleksiyonundaki kullanıcı sayısını kontrol et
    try {
      const adminCount = await Admin.countDocuments().exec();
      console.log(`[Setup API] Mevcut admin sayısı: ${adminCount}`);
      
      // Zaten admin varsa, yeni oluşturmaya gerek yok
      if (adminCount > 0) {
        console.log('[Setup API] Zaten admin kullanıcıları mevcut');
        return NextResponse.json({ 
          success: true, 
          message: 'Zaten admin kullanıcıları mevcut',
          dbInfo
        });
      }
    } catch (countError) {
      console.error('[Setup API] Admin sayısını kontrol ederken hata:', countError);
      return NextResponse.json({ 
        success: false, 
        message: `Admin sayısını kontrol ederken hata: ${countError instanceof Error ? countError.message : 'Bilinmeyen hata'}`,
        dbInfo
      }, { status: 500 });
    }
    
    // Default admin bilgilerini al
    const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123!';
    
    console.log(`[Setup API] Yeni admin oluşturuluyor (kullanıcı adı: ${defaultAdminUsername})`);
    
    // Şifreyi hashle
    const hashedPassword = hashPassword(defaultAdminPassword);
    
    // Yeni admin kullanıcısı oluştur
    try {
      const newAdmin = new Admin({
        username: defaultAdminUsername,
        password: hashedPassword,
        createdAt: new Date()
      });
      
      // Veritabanına kaydet
      await newAdmin.save();
      
      console.log('[Setup API] Yeni admin kullanıcısı başarıyla oluşturuldu');
      
      // Başarılı yanıt
      return NextResponse.json({ 
        success: true, 
        message: 'Admin kullanıcısı başarıyla oluşturuldu',
        dbInfo
      });
    } catch (saveError) {
      console.error('[Setup API] Admin kaydederken hata:', saveError);
      return NextResponse.json({ 
        success: false, 
        message: `Admin kaydederken hata: ${saveError instanceof Error ? saveError.message : 'Bilinmeyen hata'}`,
        dbInfo
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Setup API] Genel hata:', error);
    
    // Hata yanıtı
    return NextResponse.json({ 
      success: false, 
      message: `Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      stack: error instanceof Error ? error.stack : undefined,
      dbInfo
    }, { status: 500 });
  }
} 