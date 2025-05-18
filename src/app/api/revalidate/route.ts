import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  try {
    // Request'ten path'i almaya çalış, yoksa varsayılan değerler kullan
    const { path = '/' } = await request.json().catch(() => ({ path: '/' }));
    
    console.log('Revalidate isteği alındı:', { path });
    
    // Tüm script verilerini temizle
    revalidateTag('scripts');
    console.log('Cache etiketleri revalidate edildi: scripts');
    
    // Ana path'leri revalidate et
    const pathsToRevalidate = ['/', '/cekilisler', '/kampanyalar'];
    
    for (const currentPath of pathsToRevalidate) {
      try {
        revalidatePath(currentPath);
        console.log(`Path revalidate edildi: ${currentPath}`);
      } catch (error) {
        console.error(`${currentPath} path'i revalidate edilirken hata:`, error);
      }
    }
    
    // İstenen path varsa ve listede yoksa, onu da revalidate et
    if (path && !pathsToRevalidate.includes(path)) {
      try {
        revalidatePath(path);
        console.log(`Path revalidate edildi: ${path}`);
      } catch (error) {
        console.error(`${path} path'i revalidate edilirken hata:`, error);
      }
    }
    
    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      paths: [...pathsToRevalidate, path]
    });
  } catch (err) {
    console.error('Revalidation hatası:', err);
    
    // Hata durumunda bile revalidation yapmaya çalış
    try {
      revalidateTag('scripts');
      revalidatePath('/');
    } catch {}
    
    // Hata durumunda
    return NextResponse.json({
      revalidated: false,
      now: Date.now(),
      error: 'Revalidation failed'
    }, { status: 500 });
  }
} 