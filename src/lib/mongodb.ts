import { MongoClient } from 'mongodb';

/**
 * MongoDB URI'yi build için oluşturulan benzersiz veritabanı adıyla günceller
 */
function getMongoUriWithUniqueDb(baseUri: string): string {
  // Veritabanı adını environment variable'dan al
  const dbName = process.env.DEPLOY_DB_NAME;
  
  if (!dbName) {
    console.warn('DEPLOY_DB_NAME bulunamadı, varsayılan veritabanı kullanılacak');
    return baseUri;
  }
  
  // URI'yi ayrıştır
  const lastSlash = baseUri.lastIndexOf('/');
  
  // Eğer URI'de / yoksa, sonuna benzersiz veritabanı adı ekle
  if (lastSlash === -1) {
    return `${baseUri}/${dbName}`;
  }
  
  // Eğer URI'de / varsa, sonuncu / sonrasını değiştir
  const baseUriWithoutDb = baseUri.substring(0, lastSlash);
  return `${baseUriWithoutDb}/${dbName}`;
}

// MONGO_URI yoksa hata ver
if (!process.env.MONGO_URI) {
  console.error('HATA: MONGO_URI .env dosyasında tanımlanmamış');
}

// Her deploy için benzersiz veritabanı adıyla URI oluştur
const baseUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const uri = process.env.USE_PROJECT_DB === 'true' 
  ? getMongoUriWithUniqueDb(baseUri)
  : baseUri;

// Veritabanı bağlantı bilgilerini logla
console.log('MongoDB URI konfigürasyonu yapıldı:', uri.replace(/\/\/[^:]+:[^@]+@/, '//****:****@'));

// ... Geri kalan kod aynı kalacak

// ... Geri kalan kod aynı kalacak


let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// MongoClient oluştur ve bağlantı seçeneklerini ekleyin
const options = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 30000,
};

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// MongoDB'ye bağlanmayı sağlayan fonksiyon
export async function connect(): Promise<MongoClient | null> {
  try {
    console.log('MongoDB bağlantısı başlatılıyor...');
    
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => {
        reject(new Error('MongoDB bağlantısı zaman aşımına uğradı (30s)'));
      }, 30000);
    });
    
    const client = await Promise.race([clientPromise, timeoutPromise]);
    
    console.log('MongoDB bağlantısı başarılı!');
    return client as MongoClient;
  } catch (error) {
    console.error('MongoDB bağlantısı sırasında hata:', error);
    return null;
  }
}

export function isConnected(): boolean {
  try {
    return client !== undefined && client !== null;
  } catch (error) {
    console.error('MongoDB bağlantı durumu kontrol edilirken hata:', error);
    return false;
  }
}

export default clientPromise;