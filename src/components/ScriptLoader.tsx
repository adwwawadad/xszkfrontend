'use client';

import { useEffect, useRef } from 'react';

interface ScriptType {
  _id: string;
  name: string;
  content: string;
  placement: 'head' | 'body';
  isActive: boolean;
}

interface ScriptLoaderProps {
  scripts: ScriptType[];
}

export function ScriptLoader({ scripts }: ScriptLoaderProps) {
  const scriptContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scriptContainerRef.current || scripts.length === 0) return;

    // Önceki scriptleri temizle
    scriptContainerRef.current.innerHTML = '';

    // Her bir script için
    scripts.forEach(script => {
      if (!script.isActive) return;

      try {
        // Consola script yükleme bilgisi
        console.log(`Script yükleniyor: ${script.name}`, script);

        // HTML içeriği olarak script'i ekle
        const scriptContainer = document.createElement('div');
        scriptContainer.setAttribute('data-script-id', script._id);
        scriptContainer.setAttribute('data-script-name', script.name);
        scriptContainer.innerHTML = script.content;

        // Script taglarını bul ve sayfaya ekle
        const scriptTags = scriptContainer.querySelectorAll('script');
        
        scriptTags.forEach(scriptTag => {
          const newScript = document.createElement('script');
          
          // Orijinal script'in özelliklerini kopyala
          Array.from(scriptTag.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          
          // Script içeriğini kopyala
          newScript.innerHTML = scriptTag.innerHTML;
          
          // Script'i document.head veya document.body'ye ekle, placement'a göre
          const targetElement = script.placement === 'head' ? document.head : document.body;
          targetElement.appendChild(newScript);
          
          console.log(`Script başarıyla eklendi: ${script.name}`, {
            target: script.placement,
            content: newScript.innerHTML.substring(0, 50) + '...'
          });
        });

        // Script olmayan (noscript, img vs.) içeriği doğrudan ekle
        scriptContainerRef.current?.appendChild(scriptContainer);
      } catch (error) {
        console.error(`Script yükleme hatası (${script.name}):`, error);
      }
    });

    return () => {
      // Component unmount olduğunda temizlik
      if (scriptContainerRef.current) {
        scriptContainerRef.current.innerHTML = '';
      }
    };
  }, [scripts]);

  // Boş bir div döndür, script'ler JavaScript ile eklenecek
  return <div ref={scriptContainerRef} className="hidden" />;
} 