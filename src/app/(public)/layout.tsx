import Footer from "@/components/Footer";
import Header from "@/components/Header";
import UserTracker from '@/components/UserC'
import { connectMongoDB, Script } from "@/lib/models";
import { ScriptLoader } from "@/components/ScriptLoader";
import { unstable_cache } from 'next/cache';

// Script tipi
interface ScriptType {
  _id: string;
  name: string;
  content: string;
  placement: 'head' | 'body';
  isActive: boolean;
}

// Script verilerini önbelleğe alan ve belirli sürelerde yenileyen fonksiyon
const getCachedScripts = unstable_cache(
  async (): Promise<ScriptType[]> => {
    try {
      console.log('getCachedScripts fonksiyonu çağrıldı - DB sorgusu yapılıyor');
      
      await connectMongoDB();
      // any tipini kullanarak tip hatalarını aşalım
      const scriptsRaw: any[] = await Script.find({ isActive: true }).lean();
      
      console.log(`DB'den ${scriptsRaw.length} aktif script bulundu`);
      
      if (scriptsRaw.length > 0) {
        console.log('İlk script örneği:', {
          id: String(scriptsRaw[0]._id),
          name: scriptsRaw[0].name,
          placement: scriptsRaw[0].placement,
          contentLength: scriptsRaw[0].content?.length || 0
        });
      }
      
      // Mongoose dökümanlarını ScriptType'a dönüştür
      const scripts: ScriptType[] = scriptsRaw.map(script => ({
        _id: String(script._id),
        name: script.name || '',
        content: script.content || '',
        placement: script.placement || 'head',
        isActive: Boolean(script.isActive)
      }));
      
      return scripts;
    } catch (error) {
      console.error("Script yükleme hatası:", error);
      return [];
    }
  },
  ['active-scripts'], // Cache anahtarı
  { revalidate: 10, tags: ['scripts'] } // 10 saniyede bir otomatik yenileme ve etiket
);

// Script'leri doğrudan DB'den alan yedek fonksiyon
async function getScriptsDirectly(): Promise<ScriptType[]> {
  try {
    console.log('getScriptsDirectly fonksiyonu çağrıldı - Cache bypass ediliyor');
    
    await connectMongoDB();
    // any tipini kullanarak tip hatalarını aşalım
    const scriptsRaw: any[] = await Script.find({ isActive: true }).lean();
    
    console.log(`DB'den direkt olarak ${scriptsRaw.length} aktif script bulundu`);
    
    // Mongoose dökümanlarını ScriptType'a dönüştür
    const scripts: ScriptType[] = scriptsRaw.map(script => ({
      _id: String(script._id),
      name: script.name || '',
      content: script.content || '',
      placement: script.placement || 'head',
      isActive: Boolean(script.isActive)
    }));
    
    return scripts;
  } catch (error) {
    console.error("Script doğrudan yükleme hatası:", error);
    return [];
  }
}

export default async function PublicLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    // Önce cache'den dene, hata olursa doğrudan DB'den al
    let scripts: ScriptType[] = [];
    try {
      scripts = await getCachedScripts();
    } catch (error) {
      console.error("Cache'den script yükleme hatası:", error);
      scripts = await getScriptsDirectly();
    }

    // Boş dizi gelirse doğrudan DB'den tekrar dene
    if (scripts.length === 0) {
      console.log("Cache'den script bulunamadı, doğrudan DB'den alınıyor");
      scripts = await getScriptsDirectly();
    }

    const headScripts = scripts.filter((script) => script.placement === "head");
    const bodyScripts = scripts.filter((script) => script.placement === "body");

    // Script'lerin kontrol log'u
    console.log(`Toplam ${scripts.length} script yüklenecek:`, {
      head: headScripts.length,
      body: bodyScripts.length
    });

    return (
        <main>
            <UserTracker />
            <ScriptLoader scripts={headScripts} />
            <Header />
            {children}
            <Footer />
            <ScriptLoader scripts={bodyScripts} />
        </main>
    );
  }